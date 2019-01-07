File format description for the asset files:

Types:
u8, u32, u64, f32

str:
  len: u32
  data: u8[l] (ascii)

Header:
  Version: u32 //Version des Formats
  Date: u64

Texturen:
  Total Number Of Textures: u32
	  Texture Name: str
	  Texture Width: u32
	  Texture Height: u32
	  Texture Data Length t: u32
	  Texture Data: u8[t]

Shader:
  Total Number Of Shaders: u32
	  Shader Name: str
	  Shader Data: str

Mesh Data:
  Mesh Data Length m: u32
  Mesh Data: u8[m]

Objects:
  Total Number Of Objects: u32
	  Vertex shader: str
	  Fragment Shader: str
	  Number of Textures t: u8
	  Textures: (str, str)[t] //erstes feld shaderName, zweites feld sourceName
	  Mesh Name: str
	  Mesh Start: u32
	  Mesh Length: u32

Entities:
  Total number Of Entities: u32
    Entity Name: str
    Position: f32, f32, f32
