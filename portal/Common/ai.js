function ParseAIMarkdownToHtml(text) {
	if (!text) return '';

	let normalizedText = text
		.replace(/\\r\\n/g, '\n')
		.replace(/\\n/g, '\n')
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n');

	normalizedText = normalizedText.replace(/  \n/g, '<br>\n');

	const lines = normalizedText.split('\n');
	let htmlResult = [];
	let listStack = [];

	let inOlContext = false;

	function closeActiveLists() {
		while (listStack.length > 0) {
			const closedTag = listStack.pop();
			htmlResult.push(`</${closedTag}>`);
		}
	}

	for (let i = 0; i < lines.length; i++) {
		const originalLine = lines[i];
		const trimmedLine = originalLine.trim();

		if (trimmedLine === '') {
			closeActiveLists();
			inOlContext = false;
			continue;
		}

		const headerMatch = trimmedLine.match(/^(#{1,6})\s*(.*)/);
		if (headerMatch) {
			closeActiveLists();
			inOlContext = false;
			const level = headerMatch[1].length;
			const headerContent = ParseInlineMarkdown(headerMatch[2].trim());
			htmlResult.push(`<h${level} class="ai-h${level}">${headerContent}</h${level}>`);
			continue;
		}

		let lineContent = ParseInlineMarkdown(trimmedLine);
		if (/^[-*+]\s/.test(trimmedLine) || /^\s+[-*+]\s/.test(originalLine)) {
			const isNested = /^\s+[-*+]\s/.test(originalLine) || inOlContext;

			if (listStack.length === 0 || listStack[listStack.length - 1] !== 'ul') {
				closeActiveLists();
				htmlResult.push('<ul class="ai-ul">');
				listStack.push('ul');
			}

			const itemContent = lineContent.replace(/^[-*+]\s*/, '').trim();
			const className = isNested ? 'ai-li-nested' : 'ai-li';
			htmlResult.push(`<li class="${className}">${itemContent}</li>`);
		}

		else if (/^\d+\.\s/.test(trimmedLine)) {
			inOlContext = true;

			const numMatch = trimmedLine.match(/^(\d+)\.\s/);
			const originalNumber = numMatch ? numMatch[1] : '1';

			if (listStack.length === 0 || listStack[listStack.length - 1] !== 'ol') {
				closeActiveLists();
				htmlResult.push('<ol class="ai-ol">');
				listStack.push('ol');
			}

			const itemContent = lineContent.replace(/^\d+\.\s*/, '').trim();
			htmlResult.push(`<li class="ai-li" value="${originalNumber}">${itemContent}</li>`);
		}

		else {
			closeActiveLists();
			inOlContext = false;

			if (/^<strong>.*<\/strong>$/.test(lineContent)) {
				htmlResult.push(`<p class="ai-p ai-strong-title">${lineContent}</p>`);
			} else {
				htmlResult.push(`<p class="ai-p">${lineContent}</p>`);
			}
		}
	}

	closeActiveLists();
	return htmlResult.join('\n');
}

function ParseInlineMarkdown(text) {
	if (!text) return '';

	let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
	processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="ai-link">$1</a>');

	processed = processed.replace(/(<a\s[^>]*>.*?<\/a>)|(https?:\/\/[^\s<]+)/g, (match, p1, p2) => {
		if (p1) return p1;
		if (p2) {
			let url = p2;
			let trailingPunctuation = '';
			const trailingMatch = url.match(/([.,;:]+)$/);
			if (trailingMatch) {
				url = url.substring(0, url.length - trailingMatch[0].length);
				trailingPunctuation = trailingMatch[0];
			}
			return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="ai-link">${url}</a>${trailingPunctuation}`;
		}
		return match;
	});

	return processed;
}