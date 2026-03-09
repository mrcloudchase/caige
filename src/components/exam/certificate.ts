const FONT = '-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';

export function downloadCertificate(
  candidateName: string,
  correct: number,
  total: number,
  pct: number
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Dark background
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border
  const m = 40;
  ctx.strokeStyle = '#2a2e3a';
  ctx.lineWidth = 2;
  ctx.strokeRect(m, m, canvas.width - m * 2, canvas.height - m * 2);

  // Inner accent border
  const im = 48;
  ctx.strokeStyle = 'rgba(108, 159, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(im, im, canvas.width - im * 2, canvas.height - im * 2);

  // Corner accents
  const cs = 24;
  const corners: [number, number][] = [
    [m, m], [canvas.width - m, m],
    [m, canvas.height - m], [canvas.width - m, canvas.height - m],
  ];
  ctx.strokeStyle = '#6c9fff';
  ctx.lineWidth = 2;
  corners.forEach(([cx, cy]) => {
    const dx = cx < canvas.width / 2 ? 1 : -1;
    const dy = cy < canvas.height / 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx + dx * cs, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * cs);
    ctx.stroke();
  });

  ctx.textAlign = 'center';

  // Header label
  ctx.fillStyle = '#8b90a0';
  ctx.font = `600 14px ${FONT}`;
  ctx.letterSpacing = '6px';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', canvas.width / 2, 110);

  // Accent line
  ctx.strokeStyle = '#6c9fff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(500, 130);
  ctx.lineTo(canvas.width - 500, 130);
  ctx.stroke();

  // cAIge logo text — draw each part separately for color
  ctx.font = `700 72px ${FONT}`;
  const logoX = canvas.width / 2;
  const logoY = 210;
  const cWidth = ctx.measureText('c').width;
  const aiWidth = ctx.measureText('AI').width;
  const geWidth = ctx.measureText('ge').width;
  const totalWidth = cWidth + aiWidth + geWidth;
  let x = logoX - totalWidth / 2;

  ctx.fillStyle = '#e1e4eb';
  ctx.textAlign = 'left';
  ctx.fillText('c', x, logoY);
  x += cWidth;
  ctx.fillStyle = '#6c9fff';
  ctx.fillText('AI', x, logoY);
  x += aiWidth;
  ctx.fillStyle = '#e1e4eb';
  ctx.fillText('ge', x, logoY);

  ctx.textAlign = 'center';

  // Subtitle
  ctx.fillStyle = '#6c9fff';
  ctx.font = `400 20px ${FONT}`;
  ctx.fillText('Certified AI Guardrail Engineer', canvas.width / 2, 250);

  // Divider
  ctx.strokeStyle = '#2a2e3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(400, 280);
  ctx.lineTo(canvas.width - 400, 280);
  ctx.stroke();

  // "This certifies that"
  ctx.fillStyle = '#8b90a0';
  ctx.font = `400 18px ${FONT}`;
  ctx.fillText('This certifies that', canvas.width / 2, 340);

  // Candidate name
  ctx.fillStyle = '#e1e4eb';
  ctx.font = `700 48px ${FONT}`;
  ctx.fillText(candidateName, canvas.width / 2, 400);

  // Name underline
  const nameW = ctx.measureText(candidateName).width;
  ctx.strokeStyle = '#6c9fff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((canvas.width - nameW) / 2 - 20, 415);
  ctx.lineTo((canvas.width + nameW) / 2 + 20, 415);
  ctx.stroke();

  // Description
  ctx.fillStyle = '#8b90a0';
  ctx.font = `400 17px ${FONT}`;
  ctx.fillText('has successfully passed the Certified AI Guardrail Engineer (cAIge)', canvas.width / 2, 470);
  ctx.fillText('examination, demonstrating proficiency in AI guardrail design,', canvas.width / 2, 498);
  ctx.fillText('implementation, testing, and operations.', canvas.width / 2, 526);

  // Date and Score section
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Divider line above date/score
  ctx.strokeStyle = '#2a2e3a';
  ctx.beginPath();
  ctx.moveTo(300, 580);
  ctx.lineTo(canvas.width - 300, 580);
  ctx.stroke();

  // Left: Date
  ctx.fillStyle = '#e1e4eb';
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText(dateStr, 450, 630);
  ctx.strokeStyle = '#2a2e3a';
  ctx.beginPath();
  ctx.moveTo(300, 642);
  ctx.lineTo(600, 642);
  ctx.stroke();
  ctx.fillStyle = '#8b90a0';
  ctx.font = `400 14px ${FONT}`;
  ctx.fillText('Date of Certification', 450, 665);

  // Right: Score
  ctx.fillStyle = '#e1e4eb';
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText(`${correct} / ${total} (${pct}%)`, canvas.width - 450, 630);
  ctx.strokeStyle = '#2a2e3a';
  ctx.beginPath();
  ctx.moveTo(canvas.width - 600, 642);
  ctx.lineTo(canvas.width - 300, 642);
  ctx.stroke();
  ctx.fillStyle = '#8b90a0';
  ctx.font = `400 14px ${FONT}`;
  ctx.fillText('Examination Score', canvas.width - 450, 665);

  // Bottom divider
  ctx.strokeStyle = '#6c9fff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(500, 730);
  ctx.lineTo(canvas.width - 500, 730);
  ctx.stroke();

  // Organization
  ctx.fillStyle = '#6c9fff';
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText('caige.org', canvas.width / 2, 770);
  ctx.fillStyle = '#8b90a0';
  ctx.font = `400 13px ${FONT}`;
  ctx.fillText('Vendor-Agnostic AI Certification Programs', canvas.width / 2, 795);

  // Download
  const link = document.createElement('a');
  link.download = 'cAIge-Certificate-' + candidateName.replace(/\s+/g, '-') + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
