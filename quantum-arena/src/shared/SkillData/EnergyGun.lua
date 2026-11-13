-- สายย่อย: ปืนพลังงาน (สายใหญ่: อาวุธ)
return {
	Id = "EnergyGun",
	Category = "Weapon",
	DisplayName = "ปืนพลังงาน",
	Icon = "🔫",
	Color = Color3.fromHex("#FF3B3B"),
	Description = "ยิงเลเซอร์รัวจากระยะไกล พร้อมระเบิดและป้อมปืน",
	Basic = {
		Name = "ยิงเลเซอร์",
		Type = "Gun",
		Damage = 7, Range = 110, Cooldown = 0.25, Radius = 0.7,
		Ammo = 20, Reload = 1.5,
	},
	Skills = {
		{
			Id = "Overdrive", Name = "ยิงรัว", Icon = "🔥",
			Description = "ยิงเร็วขึ้น 2 เท่า กระสุนไม่ลด นาน 3 วิ",
			DamageText = "–", Cooldown = 12, Range = 0, Targeting = "Self", Duration = 3,
		},
		{
			Id = "Railgun", Name = "สไนเปอร์", Icon = "🎯",
			Description = "ชาร์จ 1 วิ แล้วยิงเส้นทะลุทุกอย่างยาว 150",
			Damage = 55, DamageText = "55", Cooldown = 14, Range = 150, Targeting = "Direction",
			Charge = 1, Width = 4,
		},
		{
			Id = "PlasmaGrenade", Name = "ระเบิดพลังงาน", Icon = "💥",
			Description = "ปาเป็นวิถีโค้ง ระเบิดรัศมี 12 + กระเด็น",
			Damage = 35, DamageText = "35", Cooldown = 9, Range = 55, Targeting = "Point",
			Radius = 12, FlightTime = 0.7,
		},
		{
			Id = "ScatterBlast", Name = "ลูกซอง", Icon = "💢",
			Description = "กระจาย 8 นัดในกรวย 30° ระยะ 25 + ดีดตัวเองถอยหลัง",
			Damage = 6, Hits = 8, DamageText = "6×8", Cooldown = 6, Range = 25, Targeting = "Direction",
			Cone = 30,
		},
		{
			Id = "Turret", Name = "ป้อมปืน", Icon = "🗼",
			Description = "วางป้อมยิงศัตรูใกล้สุดในระยะ 40 อยู่ 8 วิ มีเลือด 60",
			Damage = 5, DamageText = "5/นัด", Cooldown = 20, Range = 40, Targeting = "Self",
			Duration = 8, Health = 60, FireRate = 0.4,
		},
	},
}
