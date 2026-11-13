-- ภาพลายเอฟเฟกต์ (texture) ที่เอฟเฟกต์ใหญ่ใช้ทับบนเอฟเฟกต์โค้ด
-- เจ้าของเกมอนุญาตให้ใช้ texture ได้ (13 พ.ย. 2026) แม้ GAME_SPEC เดิมจะห้ามใช้ asset
--
-- วิธีใส่: ใน Roblox Studio เปิด Toolbox → Creator Store → หมวด Images (หรือ Decals)
-- ค้นคำตามที่เขียนไว้ในแต่ละช่อง เลือกภาพพื้นหลังโปร่งใส คลิกขวา "Copy Asset ID"
-- แล้ววางเป็น "rbxassetid://ตัวเลข" (ถ้าได้ ID ของ Decal ให้ลองใส่ในช่อง Texture ของ
-- ParticleEmitter ใน Studio ก่อน Studio จะแปลงเป็น ID ของภาพให้เอง)
--
-- ช่องที่ว่างไว้ ("") เกมจะใช้เอฟเฟกต์โค้ดล้วนแทน จึงเล่นได้ตามปกติ
-- ช่องที่ขึ้นต้นด้วย rbxasset:// เป็นภาพที่มากับ Roblox อยู่แล้ว ไม่ต้องหาเพิ่ม
return {
	Swirl = "", -- ค้น: "swirl vfx", "vortex texture" (ลายหมุนวน ใช้กับพายุหมุน/หลุมดำ)
	Slash = "", -- ค้น: "slash vfx", "anime slash texture" (เส้นฟันโค้ง)
	Shockwave = "", -- ค้น: "shockwave ring texture" (วงคลื่นกระแทกบนพื้น)
	Crack = "", -- ค้น: "ground crack decal" (รอยแตกบนพื้น)
	Lightning = "", -- ค้น: "lightning vfx texture" (ประกายสายฟ้า)
	Wind = "", -- ค้น: "wind vfx texture" (ลมพัดวน)
	Spark = "rbxasset://textures/particles/sparkles_main.dds", -- มากับ Roblox
	Smoke = "rbxasset://textures/particles/smoke_main.dds", -- มากับ Roblox
}
