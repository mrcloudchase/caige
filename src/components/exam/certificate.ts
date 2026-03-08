export function downloadCertificate(
  candidateName: string,
  correct: number,
  total: number,
  pct: number
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1100;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border
  const borderMargin = 40;
  ctx.strokeStyle = '#1a365d';
  ctx.lineWidth = 3;
  ctx.strokeRect(borderMargin, borderMargin, canvas.width - borderMargin * 2, canvas.height - borderMargin * 2);

  // Inner border
  const innerMargin = 52;
  ctx.strokeStyle = '#6c9fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(innerMargin, innerMargin, canvas.width - innerMargin * 2, canvas.height - innerMargin * 2);

  // Corner accents
  const cornerSize = 30;
  const corners: [number, number][] = [
    [borderMargin, borderMargin],
    [canvas.width - borderMargin, borderMargin],
    [borderMargin, canvas.height - borderMargin],
    [canvas.width - borderMargin, canvas.height - borderMargin],
  ];
  ctx.strokeStyle = '#1a365d';
  ctx.lineWidth = 3;
  corners.forEach(([cx, cy]) => {
    const dx = cx < canvas.width / 2 ? 1 : -1;
    const dy = cy < canvas.height / 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx + dx * cornerSize, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * cornerSize);
    ctx.stroke();
  });

  // Decorative line
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 160);
  ctx.lineTo(canvas.width - 300, 160);
  ctx.stroke();

  // Header text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4a5568';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', canvas.width / 2, 140);

  // cAIge logo
  ctx.fillStyle = '#1a365d';
  ctx.font = '700 64px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('cAIge', canvas.width / 2, 240);

  // Subtitle
  ctx.fillStyle = '#6c9fff';
  ctx.font = '400 18px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('Certified AI Guardrail Engineer', canvas.width / 2, 280);

  // Decorative line
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(400, 310);
  ctx.lineTo(canvas.width - 400, 310);
  ctx.stroke();

  // "This certifies that"
  ctx.fillStyle = '#4a5568';
  ctx.font = '400 20px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('This certifies that', canvas.width / 2, 380);

  // Name
  ctx.fillStyle = '#1a365d';
  ctx.font = '700 42px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText(candidateName, canvas.width / 2, 440);

  // Name underline
  const nameWidth = ctx.measureText(candidateName).width;
  ctx.strokeStyle = '#1a365d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((canvas.width - nameWidth) / 2 - 20, 455);
  ctx.lineTo((canvas.width + nameWidth) / 2 + 20, 455);
  ctx.stroke();

  // Description
  ctx.fillStyle = '#4a5568';
  ctx.font = '400 18px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('has successfully passed the Certified AI Guardrail Engineer (cAIge)', canvas.width / 2, 510);
  ctx.fillText('examination, demonstrating proficiency in AI guardrail design,', canvas.width / 2, 540);
  ctx.fillText('implementation, testing, and operations.', canvas.width / 2, 570);

  // Score and Date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Left column: Date
  ctx.fillStyle = '#4a5568';
  ctx.font = '400 16px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Date of Certification', 450, 700);
  ctx.fillStyle = '#1a365d';
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText(dateStr, 450, 670);

  ctx.strokeStyle = '#4a5568';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(300, 680);
  ctx.lineTo(600, 680);
  ctx.stroke();

  // Right column: Score
  ctx.fillStyle = '#4a5568';
  ctx.font = '400 16px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('Examination Score', canvas.width - 450, 700);
  ctx.fillStyle = '#1a365d';
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText(`${correct} / ${total} (${pct}%)`, canvas.width - 450, 670);

  ctx.strokeStyle = '#4a5568';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width - 600, 680);
  ctx.lineTo(canvas.width - 300, 680);
  ctx.stroke();

  // Certificate ID
  const certId = generateCertId(candidateName, dateStr, pct);
  ctx.fillStyle = '#8b90a0';
  ctx.font = '400 13px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Certificate ID: ' + certId, canvas.width / 2, 780);

  // Decorative bottom line
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 820);
  ctx.lineTo(canvas.width - 300, 820);
  ctx.stroke();

  // Organization
  ctx.fillStyle = '#6c9fff';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('caigeai.dev', canvas.width / 2, 860);

  ctx.fillStyle = '#8b90a0';
  ctx.font = '400 13px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('Vendor-Agnostic AI Certification Programs', canvas.width / 2, 885);

  // Validity
  const expiryDate = new Date(today);
  expiryDate.setFullYear(expiryDate.getFullYear() + 3);
  const expiryStr = expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillStyle = '#8b90a0';
  ctx.font = '400 12px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('Valid through ' + expiryStr + ' | 3-year recertification required', canvas.width / 2, 920);

  // Download
  const link = document.createElement('a');
  link.download = 'cAIge-Certificate-' + candidateName.replace(/\s+/g, '-') + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function generateCertId(name: string, date: string, score: number): string {
  const input = name + '|' + date + '|' + score;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return 'CAIGE-' + hex.substring(0, 4) + '-' + hex.substring(4, 8) + '-' + Date.now().toString(36).toUpperCase().slice(-4);
}
