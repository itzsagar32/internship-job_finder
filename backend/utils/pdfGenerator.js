/**
 * Pure JavaScript PDF 1.4 Generator
 * Generates valid standard PDF files with zero external dependencies
 */

function escapePdfText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function generateResumePdfBuffer(resumeData) {
  const p = resumeData.personalDetails || {};
  const education = resumeData.education || [];
  const experience = resumeData.experience || [];
  const skills = resumeData.skills || [];
  const projects = resumeData.projects || [];

  const streamLines = [];
  let currentY = 750;

  function addText(text, x, y, size = 11, font = "/F1", color = "0 0 0") {
    streamLines.push(`BT`);
    streamLines.push(`${font} ${size} Tf`);
    streamLines.push(`${color} rg`);
    streamLines.push(`1 0 0 1 ${x} ${y} Tm`);
    streamLines.push(`(${escapePdfText(text)}) Tj`);
    streamLines.push(`ET`);
  }

  function addLine(x1, y1, x2, y2, lineWidth = 1, color = "0.8 0.8 0.8") {
    streamLines.push(`${color} RG`);
    streamLines.push(`${lineWidth} w`);
    streamLines.push(`${x1} ${y1} m`);
    streamLines.push(`${x2} ${y2} l`);
    streamLines.push(`S`);
  }

  // Header Banner Background
  streamLines.push(`0.08 0.44 0.88 rg`); // Blue banner
  streamLines.push(`40 730 532 60 re`);
  streamLines.push(`f`);

  // Name & Headline
  addText(p.fullName || "Student Candidate", 55, 765, 20, "/F2", "1 1 1");
  addText(p.summary || "Full Stack Developer & Software Engineer", 55, 745, 11, "/F1", "0.9 0.95 1");

  currentY = 705;

  // Contact Info Row
  const contactParts = [
    p.email || "",
    p.phone || "",
    p.location || "",
    p.linkedin ? "LinkedIn: " + p.linkedin : "",
  ].filter(Boolean);
  if (contactParts.length > 0) {
    addText(contactParts.join("  |  "), 55, currentY, 9, "/F1", "0.3 0.3 0.3");
    currentY -= 15;
  }
  addLine(40, currentY, 572, currentY, 1, "0.85 0.85 0.85");
  currentY -= 20;

  // Section: Skills
  if (skills.length > 0) {
    addText("KEY SKILLS & COMPETENCIES", 55, currentY, 12, "/F2", "0.08 0.44 0.88");
    currentY -= 6;
    addLine(55, currentY, 250, currentY, 1.5, "0.08 0.44 0.88");
    currentY -= 15;

    const skillText = skills.join("   *   ");
    addText(skillText, 55, currentY, 10, "/F1", "0.15 0.15 0.15");
    currentY -= 25;
  }

  // Section: Experience
  if (experience.length > 0) {
    addText("PROFESSIONAL EXPERIENCE", 55, currentY, 12, "/F2", "0.08 0.44 0.88");
    currentY -= 6;
    addLine(55, currentY, 250, currentY, 1.5, "0.08 0.44 0.88");
    currentY -= 16;

    for (const exp of experience.slice(0, 3)) {
      addText(`${exp.title || "Role"} - ${exp.company || "Company"}`, 55, currentY, 11, "/F2", "0.1 0.1 0.1");
      const duration = [exp.startDate, exp.endDate || (exp.current ? "Present" : "")].filter(Boolean).join(" - ");
      if (duration) {
        addText(duration, 430, currentY, 9, "/F1", "0.4 0.4 0.4");
      }
      currentY -= 14;

      if (exp.description) {
        addText(exp.description.substring(0, 100), 65, currentY, 9, "/F1", "0.25 0.25 0.25");
        currentY -= 15;
      }
      currentY -= 5;
    }
  }

  // Section: Education
  if (education.length > 0) {
    addText("EDUCATION", 55, currentY, 12, "/F2", "0.08 0.44 0.88");
    currentY -= 6;
    addLine(55, currentY, 160, currentY, 1.5, "0.08 0.44 0.88");
    currentY -= 16;

    for (const edu of education.slice(0, 2)) {
      addText(`${edu.degree || "Degree"} - ${edu.institution || "College/University"}`, 55, currentY, 10, "/F2", "0.1 0.1 0.1");
      const yearRange = [edu.startYear, edu.endYear].filter(Boolean).join(" - ");
      if (yearRange) {
        addText(yearRange, 460, currentY, 9, "/F1", "0.4 0.4 0.4");
      }
      currentY -= 13;
      if (edu.score) {
        addText(`Grade / Score: ${edu.score}`, 65, currentY, 9, "/F1", "0.3 0.3 0.3");
        currentY -= 14;
      }
      currentY -= 4;
    }
  }

  // Section: Projects
  if (projects.length > 0) {
    addText("KEY PROJECTS", 55, currentY, 12, "/F2", "0.08 0.44 0.88");
    currentY -= 6;
    addLine(55, currentY, 180, currentY, 1.5, "0.08 0.44 0.88");
    currentY -= 16;

    for (const proj of projects.slice(0, 3)) {
      addText(`* ${proj.title || "Project"}`, 55, currentY, 10, "/F2", "0.1 0.1 0.1");
      currentY -= 13;
      if (proj.description) {
        addText(proj.description.substring(0, 95), 65, currentY, 9, "/F1", "0.3 0.3 0.3");
        currentY -= 14;
      }
    }
  }

  // Footer
  addLine(40, 50, 572, 50, 0.5, "0.8 0.8 0.8");
  addText("Generated via Internshala Premium Resume Builder | Verified & Certified", 140, 38, 8, "/F1", "0.5 0.5 0.5");

  const streamContent = streamLines.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf8");

  const objects = [];
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> >>\nendobj`
  );
  objects.push(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);
  objects.push(`5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`);
  objects.push(
    `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`
  );

  let output = "%PDF-1.4\n";
  const offsets = [];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(output, "utf8"));
    output += objects[i] + "\n";
  }

  const xrefOffset = Buffer.byteLength(output, "utf8");
  output += "xref\n";
  output += `0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";

  for (let i = 0; i < offsets.length; i++) {
    output += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }

  output += "trailer\n";
  output += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  output += "startxref\n";
  output += `${xrefOffset}\n`;
  output += "%%EOF\n";

  return Buffer.from(output, "utf8");
}

module.exports = {
  generateResumePdfBuffer,
};
