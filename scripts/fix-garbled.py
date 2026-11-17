import glob
import os

replacements = {}

# Replace U+FFFD -> em dash (—) in all English page files
for f in glob.glob('src/pages/**/*.astro', recursive=True):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fh:
        content = fh.read()
    
    changed = False
    
    # Fix U+FFFD -> em dash
    if '\ufffd' in content:
        content = content.replace('\ufffd', '—')
        changed = True
    
    # Fix Chinese text in English pages
    if '\u03f5\ufffd\ufffd' in content:
        content = content.replace('\u03f5\ufffd\ufffd', '\u7cfb\u5217')
        changed = True
    
    if changed:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f'Fixed: {f}')

# Fix factory page specifically - remove Chinese (压胶机)
factory_page = 'src/pages/factory/index.astro'
if os.path.exists(factory_page):
    with open(factory_page, 'r', encoding='utf-8') as f:
        content = f.read()

    if '压胶机' in content:
        content = content.replace('压胶机', 'laminate sealing')
        with open(factory_page, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed: src/pages/factory/index.astro (压胶机 -> laminate sealing)')
