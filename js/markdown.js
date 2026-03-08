export function renderMarkdown(md) {
    let html = '';
    const lines = md.split('\n');
    let i = 0;
    let inCodeBlock = false;
    let codeContent = '';
    let inTable = false;
    let tableRows = [];
    let inList = false;
    let listType = 'ul';
    let listItems = [];

    function flushList() {
        if (!inList) return '';
        inList = false;
        const tag = listType;
        const result = `<${tag}>${listItems.map(item => `<li>${inlineFormat(item)}</li>`).join('')}</${tag}>`;
        listItems = [];
        return result;
    }

    function flushTable() {
        if (!inTable) return '';
        inTable = false;
        if (tableRows.length < 2) return '';
        const headers = tableRows[0];
        const rows = tableRows.slice(2);
        let result = '<table><thead><tr>';
        headers.forEach(h => { result += `<th>${inlineFormat(h.trim())}</th>`; });
        result += '</tr></thead><tbody>';
        rows.forEach(row => {
            result += '<tr>';
            row.forEach((cell) => {
                result += `<td>${inlineFormat(cell.trim())}</td>`;
            });
            result += '</tr>';
        });
        result += '</tbody></table>';
        tableRows = [];
        return result;
    }

    function inlineFormat(text) {
        text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--accent)">$1</a>');
        return text;
    }

    while (i < lines.length) {
        const line = lines[i];

        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                html += flushList();
                html += `<pre><code>${codeContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
                codeContent = '';
                inCodeBlock = false;
            } else {
                html += flushList();
                html += flushTable();
                inCodeBlock = true;
            }
            i++;
            continue;
        }

        if (inCodeBlock) { codeContent += line + '\n'; i++; continue; }

        if (line.trim().startsWith('<svg')) {
            html += flushList();
            html += flushTable();
            let svgContent = line + '\n';
            i++;
            while (i < lines.length && !lines[i].includes('</svg>')) {
                svgContent += lines[i] + '\n';
                i++;
            }
            if (i < lines.length) {
                svgContent += lines[i];
                i++;
            }
            html += svgContent;
            continue;
        }

        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            html += flushList();
            if (!inTable) inTable = true;
            const cells = line.split('|').slice(1, -1);
            tableRows.push(cells);
            i++;
            continue;
        } else if (inTable) {
            html += flushTable();
        }

        const headerMatch = line.match(/^(#{1,4})\s+(.+)/);
        if (headerMatch) {
            html += flushList();
            const level = headerMatch[1].length;
            html += `<h${level}>${inlineFormat(headerMatch[2])}</h${level}>`;
            i++;
            continue;
        }

        if (line.trim() === '---' || line.trim() === '***') {
            html += flushList();
            html += '<hr>';
            i++;
            continue;
        }

        if (line.trim().startsWith('> ')) {
            html += flushList();
            let bqContent = '';
            while (i < lines.length && lines[i].trim().startsWith('> ')) {
                bqContent += lines[i].trim().substring(2) + '\n';
                i++;
            }
            while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('> ')) {
                if (lines[i].trim().startsWith('|')) break;
                bqContent += lines[i].trim() + '\n';
                i++;
            }
            html += `<blockquote>${bqContent.split('\n').filter(l => l).map(l => `<p>${inlineFormat(l)}</p>`).join('')}</blockquote>`;
            continue;
        }

        if (line.match(/^\s*[-*]\s+/)) {
            if (!inList || listType !== 'ul') { html += flushList(); inList = true; listType = 'ul'; }
            listItems.push(line.replace(/^\s*[-*]\s+/, ''));
            i++;
            continue;
        }

        if (line.match(/^\s*\d+\.\s+/)) {
            if (!inList || listType !== 'ol') { html += flushList(); inList = true; listType = 'ol'; }
            listItems.push(line.replace(/^\s*\d+\.\s+/, ''));
            i++;
            continue;
        }

        if (line.trim() === '') { html += flushList(); i++; continue; }

        html += flushList();
        let para = line;
        while (i + 1 < lines.length && lines[i + 1].trim() !== '' &&
               !lines[i + 1].match(/^#{1,4}\s/) &&
               !lines[i + 1].trim().startsWith('```') &&
               !lines[i + 1].trim().startsWith('|') &&
               !lines[i + 1].trim().startsWith('> ') &&
               !lines[i + 1].match(/^\s*[-*]\s+/) &&
               !lines[i + 1].match(/^\s*\d+\.\s+/) &&
               lines[i + 1].trim() !== '---' &&
               !lines[i + 1].trim().startsWith('<svg')) {
            i++;
            para += ' ' + lines[i];
        }
        html += `<p>${inlineFormat(para)}</p>`;
        i++;
    }

    html += flushList();
    html += flushTable();
    return html;
}
