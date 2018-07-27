import bpy
import bmesh
from struct import pack
from time import time

def encodeString(s):
    b = bytes(s, "ascii")
    l = pack("I", len(b))
    return l + b
    
def createHeaderPlaceholder(v):
    return pack("I", v) + pack("L", int(time()))

def createStringFieldFromFile(fn):
    f = open(bpy.path.abspath("//" + fn), "rb")
    d = f.read()
    l = pack("I", len(d))
    f.close()
    return l + d

def createShaderField(n, fn):
    return encodeString(n) + createStringFieldFromFile(fn)

def encodeFloatField(f):
    r = b""
    for x in f:
        r += pack("f", x)
    return b

def encodeU8(i):
    return pack("B", i)

def encodeU32(i):
    return pack("I", i)

def encodeImage(h, w, data):
  r = encodeU32(w)
  r += encodeU32(h)
  r += encodeU32(len(data))
  raw = []
  for d in data:
    raw.append(max(min(int(d * 255), 255),0))
  r += bytes(raw)
  return r

def write_data(context, filepath):
    b_objects = {}
      
    shaders = {}
    textureImages = {}
    brushes = []
    entities = {}

    meshbuffer = b""
    meshstart = 0
    
    for x in bpy.data.objects:
      if x.type == "MESH" and not x.get("vs") == None and not x.get("fs") == None:
        b_objects[x.name] = x
      if not x.get("entityName") == None:
        entities[x.get("entityName")] = {
          "name": x.get("entityName"),
          "rotation": x.rotation_quaternion.to_euler("XYZ"),
          "position": x.location
        }

    for m in b_objects:
      meshlength = 0
      odata = {}
      odata["start"] = meshstart
      m_m = b_objects[m]
      odata["name"] = m_m.name
      vertexShaderName = m_m.get("vs")
      odata["vertexShader"] = vertexShaderName
      fragmentShaderName = m_m.get("fs")
      odata["fragmentShader"] = fragmentShaderName
      if fragmentShaderName not in shaders:
        shaders[fragmentShaderName] = createShaderField(fragmentShaderName, fragmentShaderName)
      if vertexShaderName not in shaders:
        shaders[vertexShaderName] = createShaderField(vertexShaderName, vertexShaderName)
      odata["textures"] = []
      for mslot in m_m.material_slots:
        if not mslot.material == None:
          for tslot in mslot.material.texture_slots:
            if not tslot == None and tslot.texture.type == "IMAGE" and not tslot.texture.image == None and not tslot.texture.get("shaderName") == None:
              odata["textures"].append({
                "sourceName": tslot.texture.image.name,
                "shaderName": tslot.texture.get("shaderName")
              })
              if tslot.texture.image.name not in textureImages: 
                textureImages[tslot.texture.image.name] = tslot.texture.image
      temp_mesh = m_m.to_mesh(bpy.context.scene, True, "PREVIEW")
      bm = bmesh.new()
      bm.from_mesh(temp_mesh)
      bpy.data.meshes.remove(temp_mesh)
      bmesh.ops.triangulate(bm, faces=bm.faces)
      uvl = bm.loops.layers.uv.active
      for f in bm.faces:
        i = 0
        for l in f.loops:
          i += 1
          meshlength += 1
          x, y, z = l.vert.co[:]
          nx, ny, nz = l.vert.normal[:]
          u, v = l[uvl].uv[:]
          meshbuffer += pack("ffffffff", x,y,z, u,v, nx,ny,nz)
        if i > 3:
          print("that was not a triangle, lol")
      bm.free()
      odata["length"] = meshlength
      meshstart += meshlength
      brushes.append(odata)


    f = open(filepath, "wb")
    #Header
    f.write(createHeaderPlaceholder(1))
    #Texturen
    f.write(encodeU32(len(textureImages)))
    for t in textureImages:
      td = textureImages[t]
      f.write(encodeString(t))
      w = td.size[0]
      h = td.size[1]
      f.write(encodeImage(h, w, td.pixels))
    #Shader
    f.write(encodeU32(len(shaders)))
    for s in shaders:
        f.write(shaders[s])
    #Mesh Data
    f.write(encodeU32(len(meshbuffer)))
    f.write(meshbuffer)
    #Objects
    f.write(encodeU32(len(brushes)))
    for o in brushes:
        #Vertex Shader
        f.write(encodeString(o["vertexShader"]))
        #Fragment Shader
        f.write(encodeString(o["fragmentShader"]))
        #Number of Textures
        f.write(encodeU8(len(o["textures"])))
        #Textures
        for t in o["textures"]:
          f.write(encodeString(t["shaderName"]))
          f.write(encodeString(t["sourceName"]))
        #Mesh Name
        f.write(encodeString(o["name"]))
        #Mesh Start
        f.write(encodeU32(o["start"]))
        #Mesh Length   
        f.write(encodeU32(o["length"]))
    f.write(encodeU32(len(entities)))
    for ei in entities:
        e = entities[ei]
        f.write(encodeString(e["name"]))
        f.write(pack("ffffff", e["position"][0],
          e["position"][1],
          e["position"][2],
          e["rotation"][0],
          e["rotation"][1],
          e["rotation"][2]))
    return {'FINISHED'}


# ExportHelper is a helper class, defines filename and
# invoke() function which calls the file selector.
from bpy_extras.io_utils import ExportHelper
from bpy.props import StringProperty, BoolProperty, EnumProperty
from bpy.types import Operator


class ExportDataBinary(Operator, ExportHelper):
    """This appears in the tooltip of the operator and in the generated docs"""
    bl_idname = "bin_file_export.export_data"  # important since its how bpy.ops.import_test.some_data is constructed
    bl_label = "Export as packed binary"

    # ExportHelper mixin class uses this
    filename_ext = ".bin"

    filter_glob = StringProperty(
            default="*.bin",
            options={'HIDDEN'},
            maxlen=255,  # Max internal buffer length, longer would be clamped.
            )

    # List of operator properties, the attributes will be assigned
    # to the class instance from the operator settings before calling.
    #use_setting = BoolProperty(
    #        name="Example Boolean",
    #        description="Example Tooltip",
    #        default=True,
    #        )

    #type = EnumProperty(
    #        name="Example Enum",
    #        description="Choose between two items",
    #        items=(('OPT_A', "First Option", "Description one"),
    #               ('OPT_B', "Second Option", "Description two")),
    #        default='OPT_A',
    #        )

    def execute(self, context):
        return write_data(context, self.filepath)


# Only needed if you want to add into a dynamic menu
def menu_func_export(self, context):
    self.layout.operator(ExportDataBinary.bl_idname, text="Packed binary exporter")

bl_info = {"name": "Export as packed binary (*.bin)", "category": "Import/Export"}

def register():
    bpy.utils.register_class(ExportDataBinary)
    bpy.types.INFO_MT_file_export.append(menu_func_export)


def unregister():
    bpy.utils.unregister_class(ExportDataBinary)
    bpy.types.INFO_MT_file_export.remove(menu_func_export)


if __name__ == "__main__":
    
    register()
