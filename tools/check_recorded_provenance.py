"""Check preserved CC0 receipts and selected original recordings without network use.
Usage: python tools/check_recorded_provenance.py SOURCE_DIRECTORY
"""
import argparse, hashlib, json, os, pathlib
from html.parser import HTMLParser

parser=argparse.ArgumentParser();parser.add_argument('source_directory');args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
src=pathlib.Path(os.path.normpath(os.path.join(os.getcwd(),args.source_directory)))
manifest=json.loads((root/'assets/audio/manifest.json').read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
class LicenseLinks(HTMLParser):
 def __init__(self):super().__init__();self.cc0=False
 def handle_starttag(self,tag,attrs):
  if tag=='a' and any(k=='href' and 'creativecommons.org/publicdomain/zero/' in (v or '') for k,v in attrs):self.cc0=True
verified=[]
for source in manifest['sources']['sources']:
 for name in ['page','asset']:
  receipt=source[name];p=src/receipt['file']
  assert p.stat().st_size==receipt['bytes'] and sha(p)==receipt['sha256'], 'Receipt mismatch: '+str(p)
 links=LicenseLinks();links.feed((src/source['page']['file']).read_text(encoding='utf-8'));assert links.cc0
 verified.append({'id':source['id'],'author':source['author'],'license':'CC0-1.0','sourcePage':source['page']['url'],'licenseLinkPresent':True,'pageAndOriginalArchiveHashesMatch':True})
entries={}
for clip in manifest['clips']:
 for layer in clip['layers']:
  key=(layer['pack'],layer['entry']);p=src/('mechanical.wav' if layer['pack']=='mechanical' else 'extracted/'+layer['pack']+'/'+layer['entry'])
  assert sha(p)==layer['sourceSha256'], 'Original recording changed: '+str(p)
  entries[key]=layer['sourceSha256']
license=manifest['sources']['license'];assert sha(src/license['file'])==license['sha256']
result={'passed':True,'method':'Preserved source-page snapshots contain CC0 links; all original archive/page/license hashes match acquisition receipts; every selected source entry matches the processed manifest. This verifies provenance and unchanged source files, not subjective timbre.','sources':verified,'selectedOriginalEntries':len(entries),'processedClips':len(manifest['clips']),'licenseSnapshotHashMatches':True}
(root/'validation/recorded-audio-provenance.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':True,'sourceSets':len(verified),'selectedOriginalEntries':len(entries),'processedClips':len(manifest['clips'])}))
