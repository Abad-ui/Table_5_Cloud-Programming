const Report = require("../models/reportModel");
const Hazard = require("../models/hazardModel");
const Analysis = require("../models/analysisModel");
const User = require("../models/userModel");
const PDFDocument = require('pdfkit');
const getStream = require("get-stream").default;
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Group by helper (same as old version)
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const keyPath = key.split('.');
    let groupKey = keyPath.reduce((obj, k) => obj?.[k], item);
    groupKey = groupKey || "Unknown";

    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
    return result;
  }, {});
};

// Helper function to save analysis to MongoDB (same as old version)
const saveAnalysisToDB = async (analysisData, structuredText, aiInsights, generatedBy = null, analysisType = 'ai') => {
  try {
    // Extract risk level from structured text
    const riskLevelMatch = structuredText.match(/RISK ASSESSMENT: ([A-Z]+)/);
    const riskLevel = riskLevelMatch ? riskLevelMatch[1] : 'Unknown';

    // Create summary from structured text (first few lines)
    const summary = structuredText.split('\n').slice(0, 5).join(' ').substring(0, 200) + '...';

    // Transform data to match the Analysis schema
    const analysisRecord = new Analysis({
      generatedBy: generatedBy,
      dashboardStats: {
        userCount: analysisData.dashboardStats.userCount || 0,
        adminCount: analysisData.dashboardStats.adminCount || 0,
        regularCount: analysisData.dashboardStats.regularCount || 0,
        reportCount: analysisData.dashboardStats.reportCount || 0,
        verifiedCount: analysisData.dashboardStats.verifiedCount || 0,
        pendingCount: analysisData.dashboardStats.pendingCount || 0,
        resolvedCount: analysisData.dashboardStats.resolvedCount || 0,
        verificationRate: analysisData.dashboardStats.verificationRate || "0.0",
        resolutionRate: analysisData.dashboardStats.resolutionRate || "0.0",
        activeHazards: analysisData.dashboardStats.activeHazards || 0,
        totalHazards: analysisData.dashboardStats.totalHazards || 0,
      },
      mostReportedBarangays: analysisData.mostReportedBarangays.map(b => ({
        barangay: b.barangay,
        count: b.count
      })),
      reportTypeDistribution: analysisData.reportTypeDistribution.map(t => ({
        typeName: t._id,
        count: t.count
      })),
      trends: analysisData.trends.map(t => ({
        month: t._id.month,
        year: t._id.year,
        totalReports: t.totalReports
      })),
      structuredReport: structuredText,
      aiInsights: aiInsights,
      riskLevel: riskLevel,
      summary: summary,
      analysisType: analysisType // 'ai' or 'pdf'
    });

    const savedAnalysis = await analysisRecord.save();
    console.log(`Analysis saved to database with ID: ${savedAnalysis._id}`);
    return savedAnalysis;
  } catch (error) {
    console.error("Error saving analysis to database:", error);
    throw error;
  }
};

// Separate data gathering function (same as old version)
const gatherAnalysisData = async () => {
  try {
    // Only get verified, non-deleted reports
    const reports = await Report.find({ verifiedStatus: "verified", isDeleted: false }).lean();
    const hazards = await Hazard.find().lean();
    const userCount = await User.countDocuments();
    const regularCount = await User.countDocuments({ role: 'regular' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Group reports by barangay
    const barangayGroups = groupBy(reports, "address.barangay");
    const mostReportedBarangays = Object.keys(barangayGroups)
      .map(b => ({ barangay: b, count: barangayGroups[b].length }))
      .sort((a, b) => b.count - a.count)
      .filter(item => item.barangay !== "Unknown");

    // Report type distribution
    const reportTypeDistribution = {};
    reports.forEach(r => {
      const subtype = r.subtype || "Unknown";
      reportTypeDistribution[subtype] = (reportTypeDistribution[subtype] || 0) + 1;
    });

    const formattedReportDistribution = Object.keys(reportTypeDistribution)
      .map(key => ({ _id: key, count: reportTypeDistribution[key] }))
      .sort((a, b) => b.count - a.count);

    // Trends per month-year
    const trendsMap = {};
    reports.forEach(r => {
      const date = new Date(r.createdAt);
      const key = `${date.getMonth() + 1}-${date.getFullYear()}`;
      trendsMap[key] = (trendsMap[key] || 0) + 1;
    });

    const trends = Object.keys(trendsMap)
      .map(key => {
        const [month, year] = key.split("-");
        return { _id: { month: parseInt(month), year: parseInt(year) }, totalReports: trendsMap[key] };
      })
      .sort((a, b) => a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month);

    const reportCount = reports.length;
    const verifiedCount = reportCount; // all reports here are verified
    const pendingCount = 0; // no pending reports in this dataset
    const resolvedCount = hazards.filter(h => h.fixedStatus === "fixed").length;

    const dashboardStats = {
      userCount,
      regularCount,
      adminCount,
      reportCount,
      verifiedCount,
      pendingCount,
      resolvedCount,
      verificationRate: reportCount > 0 ? 100 : 0,
      resolutionRate: reportCount > 0 ? (resolvedCount / reportCount * 100).toFixed(1) : 0,
      activeHazards: hazards.filter(h => h.fixedStatus !== "fixed").length,
      totalHazards: hazards.length,
    };

    return {
      mostReportedBarangays,
      reportTypeDistribution: formattedReportDistribution,
      trends,
      dashboardStats
    };
  } catch (error) {
    console.error("Error gathering analysis data:", error);
    throw error;
  }
};

// Smart Structured Analysis - No AI, just solid logic (same as old version)
const generateStructuredAnalysis = (analysisData) => {
  const { 
    mostReportedBarangays, 
    reportTypeDistribution, 
    trends, 
    dashboardStats 
  } = analysisData;

  const topBarangays = mostReportedBarangays.slice(0, 3);
  const topHazards = reportTypeDistribution.slice(0, 3);
  
  // Calculate metrics
  const totalReports = parseInt(dashboardStats.reportCount);
  const resolutionRate = parseFloat(dashboardStats.resolutionRate);
  const activeHazards = parseInt(dashboardStats.activeHazards);
  const pendingCount = parseInt(dashboardStats.pendingCount);

  // Smart risk assessment
  const getRiskLevel = () => {
    if (activeHazards > 8 || resolutionRate < 25) return { level: 'CRITICAL', urgency: 'IMMEDIATE' };
    if (activeHazards > 5 || resolutionRate < 40) return { level: 'HIGH', urgency: 'URGENT' };
    if (activeHazards > 2 || resolutionRate < 60) return { level: 'MEDIUM', urgency: 'PRIORITY' };
    return { level: 'LOW', urgency: 'MONITOR' };
  };

  const risk = getRiskLevel();

  // Trend analysis
  const getTrendAnalysis = () => {
    if (!trends || trends.length < 2) return 'insufficient data';
    
    const recent = trends[trends.length - 1].totalReports;
    const previous = trends[trends.length - 2].totalReports;
    
    if (recent > previous * 1.3) return 'significantly increasing';
    if (recent > previous * 1.1) return 'increasing';
    if (recent < previous * 0.9) return 'decreasing';
    return 'stable';
  };

  const trendDirection = getTrendAnalysis();

  // Hazard-specific recommendations
  const getHazardRecommendations = () => {
    const recommendations = [];
    
    topHazards.forEach(hazard => {
      const type = hazard._id.toLowerCase();
      const count = hazard.count;
      
      // Natural Hazards
      if (type.includes('flood')) {
        recommendations.push(`Flood control and drainage improvement (${count} cases)`);
      } else if (type.includes('typhoon')) {
        recommendations.push(`Typhoon preparedness and evacuation planning (${count} cases)`);
      } else if (type.includes('landslide')) {
        recommendations.push(`Landslide risk assessment and slope stabilization (${count} cases)`);
      } else if (type.includes('earthquake')) {
        recommendations.push(`Earthquake preparedness and structural safety (${count} cases)`);
      } else if (type.includes('volcanic')) {
        recommendations.push(`Volcanic activity monitoring and evacuation zones (${count} cases)`);
      } else if (type.includes('storm surge')) {
        recommendations.push(`Coastal protection and storm surge barriers (${count} cases)`);
      } else if (type.includes('drought')) {
        recommendations.push(`Water conservation and drought management (${count} cases)`);
      } else if (type.includes('tsunami')) {
        recommendations.push(`Tsunami warning systems and evacuation routes (${count} cases)`);
      }
      
      // Infrastructure Hazards
      else if (type.includes('pothole')) {
        recommendations.push(`Road repair and maintenance (${count} cases)`);
      } else if (type.includes('collapsed building')) {
        recommendations.push(`Building safety inspection and demolition (${count} cases)`);
      } else if (type.includes('broken bridge')) {
        recommendations.push(`Bridge repair and structural assessment (${count} cases)`);
      } else if (type.includes('damaged drainage')) {
        recommendations.push(`Drainage system repair and maintenance (${count} cases)`);
      } else if (type.includes('fallen tree')) {
        recommendations.push(`Tree clearing and urban forestry management (${count} cases)`);
      } else if (type.includes('fallen post')) {
        recommendations.push(`Utility pole repair and safety measures (${count} cases)`);
      }
      
      // Utility Hazards
      else if (type.includes('power outage')) {
        recommendations.push(`Power restoration and electrical system repair (${count} cases)`);
      } else if (type.includes('broken streetlight')) {
        recommendations.push(`Streetlight repair and maintenance (${count} cases)`);
      } else if (type.includes('water leak')) {
        recommendations.push(`Water pipe repair and leak detection (${count} cases)`);
      } else if (type.includes('telecommunication')) {
        recommendations.push(`Telecom service restoration (${count} cases)`);
      } else if (type.includes('gas leak')) {
        recommendations.push(`Gas leak repair and safety evacuation (${count} cases)`);
      }
      
      // Human-Induced Hazards
      else if (type.includes('fire incident')) {
        recommendations.push(`Fire safety inspection and response planning (${count} cases)`);
      } else if (type.includes('road accident')) {
        recommendations.push(`Road safety measures and traffic management (${count} cases)`);
      } else if (type.includes('chemical spill')) {
        recommendations.push(`Hazardous material cleanup and safety protocols (${count} cases)`);
      } else if (type.includes('garbage pileup')) {
        recommendations.push(`Waste management and cleanup operations (${count} cases)`);
      } else if (type.includes('vandalism')) {
        recommendations.push(`Public property protection and security measures (${count} cases)`);
      }
      
      // Default for any unclassified hazards
      else {
        recommendations.push(`${hazard._id} mitigation and response (${count} cases)`);
      }
    });

    return recommendations.slice(0, 3);
  };

  // Agency coordination based on hazard types
  const getAgencyCoordination = () => {
    const agencies = new Set();
    
    topHazards.forEach(hazard => {
      const type = hazard._id.toLowerCase();
      
      // Natural Hazards
      if (type.includes('flood') || type.includes('typhoon') || type.includes('storm surge')) {
        agencies.add('MDRRMO').add('PAGASA').add('DPWH');
      } else if (type.includes('landslide') || type.includes('earthquake') || type.includes('volcanic')) {
        agencies.add('MDRRMO').add('PHIVOLCS').add('DPWH');
      } else if (type.includes('drought')) {
        agencies.add('PAGASA').add('LGU Agriculture').add('NWRB');
      } else if (type.includes('tsunami')) {
        agencies.add('PHIVOLCS').add('MDRRMO').add('PCG');
      }
      
      // Infrastructure Hazards
      else if (type.includes('pothole') || type.includes('road') || type.includes('bridge')) {
        agencies.add('DPWH').add('LGU Engineering');
      } else if (type.includes('building') || type.includes('drainage')) {
        agencies.add('LGU Engineering').add('DPWH');
      } else if (type.includes('fallen tree')) {
        agencies.add('LGU Engineering').add('DENR');
      } else if (type.includes('fallen post')) {
        agencies.add('Electric Cooperative').add('Telecom Companies');
      }
      
      // Utility Hazards
      else if (type.includes('power outage') || type.includes('streetlight')) {
        agencies.add('Electric Cooperative').add('LGU Engineering');
      } else if (type.includes('water leak')) {
        agencies.add('LWUA').add('Water District').add('LGU Engineering');
      } else if (type.includes('telecommunication')) {
        agencies.add('Telecom Companies').add('NTC');
      } else if (type.includes('gas leak')) {
        agencies.add('BFP').add('Gas Company').add('LGU Rescue');
      }
      
      // Human-Induced Hazards
      else if (type.includes('fire incident')) {
        agencies.add('BFP').add('LGU Rescue').add('MDRRMO');
      } else if (type.includes('road accident')) {
        agencies.add('PNP').add('LGU Rescue').add('DPWH');
      } else if (type.includes('chemical spill')) {
        agencies.add('BFP').add('DENR').add('LGU Rescue');
      } else if (type.includes('garbage pileup')) {
        agencies.add('LGU Sanitation').add('DENR').add('Barangay Council');
      } else if (type.includes('vandalism')) {
        agencies.add('PNP').add('Barangay Council').add('LGU Peace and Order');
      }
      
      // Always include these for comprehensive response
      agencies.add('Barangay Council').add('LGU DRRM');
    });

    return Array.from(agencies).slice(0, 6);
  };

  const hazardRecs = getHazardRecommendations();
  const agencies = getAgencyCoordination();

  // Generate the analysis
  return `MUNICIPAL HAZARD ANALYSIS REPORT
===========================================

RISK ASSESSMENT: ${risk.level}
Report Statistics: ${totalReports} total reports | ${resolutionRate}% resolution rate
Active Hazards: ${activeHazards} | Pending: ${pendingCount}
Trend: ${trendDirection}

EXECUTIVE SUMMARY
=================
${risk.urgency} attention required. Analysis of ${totalReports} hazard reports shows ${trendDirection} activity with ${activeHazards} unresolved cases. Primary concentration in ${topBarangays.length > 0 ? topBarangays.map(b => b.barangay).join(', ') : 'multiple areas'}.

CRITICAL FINDINGS
=================
• GEOGRAPHIC HOTSPOTS: ${topBarangays.map(b => `${b.barangay} (${b.count})`).join(' | ')}
• HAZARD DISTRIBUTION: ${topHazards.map(h => `${h._id} (${h.count})`).join(' | ')}
• OPERATIONAL STATUS: ${pendingCount} pending verifications, ${dashboardStats.verifiedCount} verified reports

PRIORITY ACTIONS
================
${hazardRecs.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

AGENCY COORDINATION
===================
• Primary: ${agencies.slice(0, 3).join(', ')}
• Support: ${agencies.slice(3).join(', ') || 'Barangay monitoring teams'}

Generated: ${new Date().toLocaleDateString('en-PH', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
===========================================`;
};

// Generate PDF Report (same as old version)
const generatePDFReport = async (analysisData, aiInsights) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        bufferPages: true
      });
      
      const buffers = [];
      
      // Collect PDF data
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Set default font
      doc.font('Helvetica');

      // Title
      doc.fontSize(20).font('Helvetica-Bold')
         .text("MUNICIPAL HAZARD ANALYSIS REPORT", { align: "center" });
      doc.moveDown(0.5);
      
      // Date
      doc.fontSize(10).font('Helvetica')
         .text(`Generated on: ${new Date().toLocaleString('en-PH', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         })}`, { align: "center" });
      doc.moveDown(1);

      // Executive Summary Section
      doc.fontSize(14).font('Helvetica-Bold')
         .text("EXECUTIVE SUMMARY", { underline: true });
      doc.moveDown(0.5);
      
      // Parse and format the structured analysis
      const structuredText = generateStructuredAnalysis(analysisData);
      const sections = parseStructuredText(structuredText);
      
      // Add each section to PDF
      sections.forEach(section => {
        if (section.title) {
          doc.fontSize(12).font('Helvetica-Bold')
             .text(section.title.toUpperCase(), { continued: false });
          doc.moveDown(0.3);
        }
        
        if (section.content) {
          doc.fontSize(10).font('Helvetica')
             .text(section.content, {
               align: 'justify',
               lineGap: 2,
               paragraphGap: 3,
               width: 500,
               indent: 5
             });
          doc.moveDown(0.5);
        }
      });

      // AI Insights Section
      if (aiInsights && aiInsights !== "AI analysis unavailable due to API error.") {
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold')
           .text("DETAILED ANALYSIS & RECOMMENDATIONS", { align: "center", underline: true });
        doc.moveDown(0.5);
        
        // Clean and format AI insights
        const formattedInsights = cleanAndFormatText(aiInsights);
        doc.fontSize(10).font('Helvetica')
           .text(formattedInsights, {
             align: 'justify',
             lineGap: 2,
             paragraphGap: 5,
             width: 500,
             indent: 5
           });
      }

      // Statistics Section
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold')
         .text("STATISTICAL OVERVIEW", { align: "center", underline: true });
      doc.moveDown(0.5);

      // Key Statistics
      const stats = [
        `Total Reports: ${analysisData.dashboardStats.reportCount}`,
        `Verified Reports: ${analysisData.dashboardStats.verifiedCount}`,
        `Pending Verification: ${analysisData.dashboardStats.pendingCount}`,
        `Resolved Hazards: ${analysisData.dashboardStats.resolvedCount}`,
        `Active Hazards: ${analysisData.dashboardStats.activeHazards}`,
        `Resolution Rate: ${analysisData.dashboardStats.resolutionRate}%`,
        `Verification Rate: ${analysisData.dashboardStats.verificationRate}%`
      ];

      stats.forEach(stat => {
        doc.fontSize(10).font('Helvetica')
           .text(`• ${stat}`, { paragraphGap: 2 });
      });

      doc.moveDown(1);

      // Top Barangays
      if (analysisData.mostReportedBarangays?.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold')
           .text("MOST REPORTED BARANGAYS:", { underline: true });
        doc.moveDown(0.3);
        
        analysisData.mostReportedBarangays.slice(0, 5).forEach((b, index) => {
          doc.fontSize(10).font('Helvetica')
             .text(`${index + 1}. ${b.barangay}: ${b.count} reports`, { paragraphGap: 1 });
        });
        doc.moveDown(0.5);
      }

      // Hazard Distribution
      if (analysisData.reportTypeDistribution?.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold')
           .text("HAZARD TYPE DISTRIBUTION:", { underline: true });
        doc.moveDown(0.3);
        
        analysisData.reportTypeDistribution.slice(0, 5).forEach((t, index) => {
          doc.fontSize(10).font('Helvetica')
             .text(`${index + 1}. ${t._id}: ${t.count} cases`, { paragraphGap: 1 });
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to parse structured text into sections (same as old version)
const parseStructuredText = (text) => {
  const sections = [];
  const lines = text.split('\n');
  let currentSection = { title: '', content: '' };
  let inSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '' || trimmedLine.includes('===') || trimmedLine.includes('=')) {
      continue; // Skip separator lines
    }
    
    // Check if line is a section title (all caps or has specific markers)
    if (trimmedLine === trimmedLine.toUpperCase() && 
        trimmedLine.length > 3 && 
        !trimmedLine.startsWith('🔴') && 
        !trimmedLine.startsWith('🟠') && 
        !trimmedLine.startsWith('🟡') && 
        !trimmedLine.startsWith('🟢') &&
        !trimmedLine.includes('RISK ASSESSMENT')) {
      
      // Save previous section if it exists
      if (inSection && currentSection.content.trim()) {
        sections.push({ ...currentSection });
      }
      
      // Start new section
      currentSection = {
        title: trimmedLine,
        content: ''
      };
      inSection = true;
    } else if (inSection) {
      // Add to current section content
      if (currentSection.content) {
        currentSection.content += ' ' + cleanTextLine(trimmedLine);
      } else {
        currentSection.content = cleanTextLine(trimmedLine);
      }
    }
  }

  // Add the last section
  if (inSection && currentSection.content.trim()) {
    sections.push({ ...currentSection });
  }

  return sections;
};

// Helper function to clean text lines (same as old version)
const cleanTextLine = (line) => {
  return line
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s\./g, '.') // Fix space before period
    .replace(/\s,/g, ',') // Fix space before comma
    .trim();
};

// Helper function to clean and format AI insights text (same as old version)
const cleanAndFormatText = (text) => {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Clean up formatting issues
      return line
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
        .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/([.,!?])\s+/g, '$1 ') // Fix punctuation spacing
        .replace(/\s\./g, '.') // Remove space before period
        .replace(/\s,/g, ',') // Remove space before comma
        .replace(/(\d+)\.\s+/g, '$1. ') // Fix numbered list spacing
        .trim();
    })
    .join('\n\n');
};

// Enhanced version with better formatting
const enhanceAnalysisWithOpenAI = async (structuredText) => {
  try {
    const prompt = `Municipal Hazard Data: ${structuredText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a municipal planning officer creating an executive brief. Format the response CLEANLY with clear sections.

          CRITICAL: Remove all special characters like Ø=Ý4 and use proper formatting.

          Required Structure:
          🚨 EXECUTIVE SUMMARY
          [1-2 paragraph overview]

          📊 CURRENT SITUATION
          • Key statistics and trends
          • Geographic hotspots
          • Hazard distribution

          🎯 IMMEDIATE ACTIONS (Next 7 days)
          [3-4 specific actions with agencies]

          💰 RESOURCE REQUIREMENTS
          • Budget breakdown
          • Manpower needs
          • Timeline

          📋 ACTION MATRIX
          | Task | Responsible | Deadline | Budget |
          |------|-------------|----------|--------|

          ⚠️ RISKS & CONTINGENCIES
          • What happens if not addressed
          • Backup plans

          Use clean formatting:
          - Use • for bullet points
          - Use | for tables
          - No special characters
          - Clear section headers with emojis
          - Keep it professional but readable`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Detailed analysis temporarily unavailable.";
  }
};

// Get only the data (no AI call) - for initial page load (same as old version)
const getAnalysisData = async (req, res) => {
  try {
    const analysisData = await gatherAnalysisData();
    
    return res.json({
      success: true,
      message: "Analysis data retrieved successfully",
      analysis: {
        ...analysisData,
        aiInsights: null, // No AI insights yet
      },
    });
  } catch (error) {
    console.error("Error getting analysis data:", error);
    return res.status(500).json({ success: false, message: "Error getting analysis data." });
  }
};

// Get AI-enhanced analysis (called when button is pressed) (same as old version)
const getAIAnalysis = async (req, res) => {
  try {
    const analysisData = await gatherAnalysisData();
    
    // Generate structured analysis
    const analysisText = generateStructuredAnalysis(analysisData);

    // Generate AI-enhanced insights (only when specifically requested)
    const aiInsights = await enhanceAnalysisWithOpenAI(analysisText);

    // Save to MongoDB
    const savedAnalysis = await saveAnalysisToDB(
      analysisData, 
      analysisText, 
      aiInsights, 
      req.user?._id, // Assuming you have user authentication
      'ai'
    );

    return res.json({
      success: true,
      message: "AI analysis generated and saved successfully",
      analysis: {
        ...analysisData,
        structured: analysisText,
        aiInsights,
        savedAnalysisId: savedAnalysis._id // Return the saved analysis ID
      },
    });
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    return res.status(500).json({ success: false, message: "Error generating AI analysis." });
  }
};

// Generate PDF with fresh AI analysis (creates new analysis)
const generateAnalysisPDF = async (req, res) => {
  try {
    const analysisData = await gatherAnalysisData();
    const analysisText = generateStructuredAnalysis(analysisData);
    
    // Get fresh AI insights for PDF
    const aiInsights = await enhanceAnalysisWithOpenAI(analysisText);
    
    // Save to MongoDB before generating PDF
    const savedAnalysis = await saveAnalysisToDB(
      analysisData, 
      analysisText, 
      aiInsights, 
      req.user?._id,
      'pdf'
    );

    // Wait for the PDF buffer to be generated
    const pdfBuffer = await generatePDFReport(analysisData, aiInsights);
    
    // Set headers before sending
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="hazard-analysis-${savedAnalysis._id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    
    // Send the buffer
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error generating PDF report.",
      error: error.message 
    });
  }
};

// Generate PDF from saved analysis (no new AI call)
const generatePDFFromSaved = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the saved analysis from database
    const savedAnalysis = await Analysis.findById(id)
      .populate('generatedBy', 'name email');

    if (!savedAnalysis) {
      return res.status(404).json({ 
        success: false, 
        message: "Saved analysis not found" 
      });
    }

    // Convert the saved analysis back to the format expected by generatePDFReport
    const analysisData = {
      dashboardStats: savedAnalysis.dashboardStats,
      mostReportedBarangays: savedAnalysis.mostReportedBarangays,
      reportTypeDistribution: savedAnalysis.reportTypeDistribution.map(t => ({
        _id: t.typeName, // Convert typeName back to _id for compatibility
        count: t.count
      })),
      trends: savedAnalysis.trends
    };

    // Use the saved AI insights
    const aiInsights = savedAnalysis.aiInsights;

    // Generate PDF using saved data (no new AI call)
    const pdfBuffer = await generatePDFReport(analysisData, aiInsights);
    
    // Set headers before sending
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="hazard-analysis-${savedAnalysis._id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    
    // Send the buffer
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF from saved analysis:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error generating PDF from saved analysis.",
      error: error.message 
    });
  }
};

// Keep the original function for backward compatibility (optional) (same as old version)
const getAnalysis = async (req, res) => {
  try {
    const analysisData = await gatherAnalysisData();
    const analysisText = generateStructuredAnalysis(analysisData);
    const aiInsights = await enhanceAnalysisWithOpenAI(analysisText);

    // Save to MongoDB
    const savedAnalysis = await saveAnalysisToDB(
      analysisData, 
      analysisText, 
      aiInsights, 
      req.user?._id,
      'full'
    );

    return res.json({
      success: true,
      message: "Analysis generated and saved successfully",
      analysis: {
        ...analysisData,
        structured: analysisText,
        aiInsights,
        savedAnalysisId: savedAnalysis._id
      },
    });
  } catch (error) {
    console.error("Error generating analysis:", error);
    return res.status(500).json({ success: false, message: "Error generating analysis." });
  }
};

// Get saved analyses (same as old version)
const getSavedAnalyses = async (req, res) => {
  try {
    const { limit = 10, page = 1, sortField = 'generatedAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    // Validate sortField
    const validFields = ['generatedAt']
    const sortBy = validFields.includes(sortField) ? sortField : 'generatedAt';
    const order = sortOrder === 'asc' ? 1 : -1;

    const analyses = await Analysis.find()
      .populate('generatedBy', 'name email')
      .sort({ [sortBy]: order })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Analysis.countDocuments();

    return res.json({
      success: true,
      message: "Saved analyses retrieved successfully",
      data: {
        analyses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error("Error retrieving saved analyses:", error);
    return res.status(500).json({ success: false, message: "Error retrieving saved analyses." });
  }
};


// Get analysis by ID (same as old version)
const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await Analysis.findById(id)
      .populate('generatedBy', 'name email');

    if (!analysis) {
      return res.status(404).json({ success: false, message: "Analysis not found" });
    }

    return res.json({
      success: true,
      message: "Analysis retrieved successfully",
      data: analysis
    });
  } catch (error) {
    console.error("Error retrieving analysis:", error);
    return res.status(500).json({ success: false, message: "Error retrieving analysis." });
  }
};

module.exports = { 
  getAnalysisData, 
  getAIAnalysis, 
  generateAnalysisPDF,
  generatePDFFromSaved,
  getAnalysis, // Keep for backward compatibility
  gatherAnalysisData, // export if needed elsewhere
  getAnalysisById,
  getSavedAnalyses
};