import sys, types
class M:
    def __init__(s,n="m"): object.__setattr__(s,'_n',n); object.__setattr__(s,'_d',{})
    def __getattr__(s,k):
        if k.startswith('__'): raise AttributeError(k)
        d=object.__getattribute__(s,'_d')
        if k not in d: d[k]=M(s._n+'.'+k)
        return d[k]
    def __setattr__(s,k,v): s._d[k]=v
    def __call__(s,*a,**k): return M(s._n+'()')
    def __getitem__(s,k): return M(s._n+'[]')
    def __setitem__(s,k,v): pass
    def __iter__(s): return iter([])
    def __len__(s): return 0
    def __bool__(s): return True
    def __contains__(s,k): return False
    def __mul__(s,o): return s
    __rmul__=__add__=__radd__=__sub__=__rsub__=__truediv__=__mul__
    def __float__(s): return 1.0
    def __int__(s): return 1
    def __index__(s): return 1
    def __lt__(s,o): return False
    __gt__=__le__=__ge__=__lt__
for name in ['bpy','bpy.types','bpy.props','mathutils','bmesh']:
    sys.modules[name]=M(name)
sys.modules['bpy'].app=types.SimpleNamespace(version=(4,2,0),version_string="4.2.0")
import math
class V(list):
    def __init__(s,*a): super().__init__(a[0] if len(a)==1 else a)
sys.modules['mathutils'].Vector=V; sys.modules['mathutils'].Euler=V
sys.argv=[sys.argv[1]]
src=open(sys.argv[0],encoding='utf-8').read()
exec(compile(src,sys.argv[0],'exec'),{'__name__':'__main__','__file__':sys.argv[0]})
print("MOCK RUN OK")
