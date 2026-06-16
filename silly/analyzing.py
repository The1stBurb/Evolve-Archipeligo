import re
from data.achieve import dat as ach
from data.actions import dat as act
from data.arpa import dat as arpa
from data.civics import dat as civ
from data.edenic import dat as eden
from data.functions import dat as func
from data.governor import dat as gov
from data.index import dat as index
from data.industry import dat as indus
from data.jobs import dat as job
from data.main import dat as main
from data.portal import dat as port
from data.races import dat as race
from data.resources import dat as res
from data.seasons import dat as seas
from data.space import dat as space
from data.tech import dat as tech
from data.truepath import dat as tpath

from html.parser import HTMLParser

class Node:
    def __init__(self, tag=None, attrs=None, parent=None):
        self.tag = tag
        self.attrs = dict(attrs or {})
        self.children = []
        self.parent = parent

    def add_child(self, node):
        self.children.append(node)


class HTMLToTree(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = Node("root")
        self.current = self.root

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.current)
        self.current.add_child(node)
        self.current = node

    def handle_endtag(self, tag):
        if self.current.parent:
            self.current = self.current.parent

    def handle_data(self, data):
        if data.strip():
            self.current.add_child(data)


def node_to_bit(node):
    if isinstance(node, str):
        return repr(node)

    children = [node_to_bit(child) for child in node.children]

    return BIT(node.tag, node.attrs, children)


def resolve_dynamic(html):
    """Convert JS template expression syntax to Vue template syntax.

    ${loc('key')} → {{ label('key') }}
    ${any_expr}   → {{ any_expr }}
    """
    # Named loc() calls first (more specific pattern)
    html = re.sub(r"\$\{loc\(['\"]([^'\"]+)['\"]\)\}", r"{{ label('\1') }}", html)
    # Generic fallback for any remaining ${expr}
    html = re.sub(r'\$\{([^}]+)\}', r'{{ \1 }}', html)
    return html


def normalize_vue_slots(html):
    """Normalize Vue 3 slot shorthand so html.parser can handle it.

    <template #trigger> → <template v-slot:trigger>
    The emitter in emit_vue.py converts v-slot:name back to #name on output.
    """
    return re.sub(r'<(template)\s+#(\w+)', r'<\1 v-slot:\2', html)


def html_to_bit(html):
    html = normalize_vue_slots(html)
    html = resolve_dynamic(html)
    parser = HTMLToTree()
    parser.feed(html)

    # skip artificial root
    return [node_to_bit(child) for child in parser.root.children]


# # Example
# html = '<div class="someClass"><span>${aFunc(someVal)}</span></div>'

# result = html_to_bit(html)

# for r in result:
#     print(r)

class BIT:
    def __init__(self,name,specs,kids):
        self.nm=name
        self.specs=specs
        self.kids=kids
    def __str__(self):return f"<{self.nm} | {' '.join(str(i)+'='+str(self.specs[i]) for i in self.specs)}>{self.kids}</{self.nm}>"
    def __repr__(self):return f"BIT('{self.nm}',{self.specs},{self.kids})"#self.__str__()
broke=[]
splits=[]

ActualData=ach
if __name__=="__main__":
    for i in range(0,len(ActualData)):
        split=html_to_bit(ActualData[i])
        # split=re.findall(r"<(.*?) (.*?)>(.*)</.*>$",ach[i])
        # print(split,ActualData[i])
        splits.append(split)
    with open("silly/urStrings.py","w")as string:
        string.write("from analyzing import BIT\n[\n  "+",\n  ".join(repr(i) for i in splits)+",\n]")

    """
    so scrape.py will get each .js file itself and yeet it into the silly/data/ folder
    then in here (analyzing.py) specify on line 89 which one you want using the imports at the top
    it will spit it out into urStrings.py rn with some fancy stuff

    If you dont want it to be parsed and just want the raw HTML, just look at the stuff in the /data/ folder
    
    
    """