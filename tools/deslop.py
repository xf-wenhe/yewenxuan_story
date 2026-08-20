import re, sys

EXCL_BEFORE = '不头图画影录摄肖'
MARKER2 = ['好像', '像是', '仿佛', '宛如', '如同', '犹如']
# quality nouns that form simile tails "X一样 / X一般"
SIMILE_NOUNS = ['死', '水', '冰', '火', '潮水', '石头', '木头', '机器', '纸', '铁',
                '鬼', '死人', '刀', '针', '网', '墙']

PROTECT = re.compile(r'「[^「」]*」|『[^『』]*』|“[^“”]*”|‘[^‘’]*’|【[^【】]*】')


def protect_spans(text, func):
    """Apply func to text but leave quoted / bracketed spans untouched."""
    out = []
    last = 0
    for m in PROTECT.finditer(text):
        out.append(func(text[last:m.start()]))
        out.append(m.group(0))
        last = m.end()
    out.append(func(text[last:]))
    return ''.join(out)


def strip_metaphors(text):
    def _inner(s):
        for m in MARKER2:
            s = re.sub(r'(?<!不)' + m, '', s)
        s = re.sub(r'(?<![%s])像(?![头像素])' % EXCL_BEFORE, '', s)
        for n in SIMILE_NOUNS:
            s = s.replace(n + '一样', n)
            s = s.replace(n + '一般', n)
        s = re.sub(r'似的|般地', '', s)
        s = re.sub(r'般(?=[，。！？\n])', '', s)
        return s
    return protect_spans(text, _inner)


def strip_quote_emphasis(text):
    # 1-4 char emphasis fragments without inner punctuation, in any quote style
    text = re.sub(r'「([^「」。！？…，；：、]{1,4})」', r'\1', text)
    text = re.sub(r'『([^『』。！？…，；：、]{1,4})』', r'\1', text)
    text = re.sub(r'"([^"”。！？…，；：、]{1,4})"', r'\1', text)
    text = re.sub(r"'([^'’。！？…，；：、]{1,4})'", r'\1', text)
    return text


def reduce_parallelism(text):
    def _inner(s):
        # force the repeated verb to 1 char; drop the 2nd clause up to sentence end,
        # keeping the trailing period and never cutting mid-word
        pat = re.compile(r'不([\u3400-\u9fff])([\u3400-\u9fff]{1,30})[，,]\s*不\1([^。！？]{1,40})([。！？]?)')
        return pat.sub(r'不\1\2\4', s)
    return protect_spans(text, _inner)


def transform(text):
    text = strip_quote_emphasis(text)
    text = strip_metaphors(text)
    text = reduce_parallelism(text)
    return text


if __name__ == '__main__':
    f = sys.argv[1]
    t = open(f, encoding='utf-8').read()
    out = transform(t)
    cb = len(re.findall(r'[\u4e00-\u9fff]', t))
    ca = len(re.findall(r'[\u4e00-\u9fff]', out))
    open(f, 'w', encoding='utf-8').write(out)
    print('%s CJK %d -> %d' % (f, cb, ca))
