-- โครงสายใหญ่ / สายย่อย และตัวช่วยค้นหาข้อมูลสกิล
local SkillData = script.Parent:WaitForChild("SkillData")

local Classes = {}

Classes.Categories = {
	{
		Id = "Power",
		DisplayName = "พลัง",
		Icon = "🔮",
		Color = Color3.fromHex("#8A2BE2"),
		Description = "ควบคุมมิติ เวลา และสายฟ้า สู้จากระยะไกลด้วยพลังพิเศษ",
		Subclasses = { "Dimension", "Time", "Lightning" },
	},
	{
		Id = "Weapon",
		DisplayName = "อาวุธ",
		Icon = "⚔️",
		Color = Color3.fromHex("#00FFD5"),
		Description = "ดาบ ปืน และเคียว อาวุธแห่งอนาคตที่ทรงพลัง",
		Subclasses = { "QuantumSword", "EnergyGun", "ShadowScythe" },
	},
	{
		Id = "Combat",
		DisplayName = "ทักษะต่อสู้",
		Icon = "👊",
		Color = Color3.fromHex("#FF8C00"),
		Description = "หมัดเทพและวิชานินจา ประชิดตัวรวดเร็ว",
		Subclasses = { "DivineFist", "Ninja" },
	},
}

Classes.Subclasses = {}
Classes.SubclassOrder = {}

for _, category in ipairs(Classes.Categories) do
	for _, subId in ipairs(category.Subclasses) do
		local data = require(SkillData:WaitForChild(subId))
		data.SkillById = {}
		for index, skill in ipairs(data.Skills) do
			skill.Index = index
			data.SkillById[skill.Id] = skill
		end
		Classes.Subclasses[subId] = data
		table.insert(Classes.SubclassOrder, subId)
	end
end

function Classes.GetCategory(categoryId)
	for _, category in ipairs(Classes.Categories) do
		if category.Id == categoryId then
			return category
		end
	end
	return nil
end

function Classes.GetSubclass(subclassId)
	if type(subclassId) ~= "string" then
		return nil
	end
	return Classes.Subclasses[subclassId]
end

function Classes.GetSkill(subclassId, skillId)
	local sub = Classes.GetSubclass(subclassId)
	if not sub or type(skillId) ~= "string" then
		return nil
	end
	return sub.SkillById[skillId]
end

-- ตรวจว่าชุดสกิลถูกต้อง: สายย่อยมีจริง, ครบ 3, มีจริงทุกอัน, ไม่ซ้ำ
function Classes.ValidateLoadout(subclassId, skills)
	local sub = Classes.GetSubclass(subclassId)
	if not sub then
		return false, "ไม่พบสายย่อยนี้"
	end
	if type(skills) ~= "table" or #skills ~= 3 then
		return false, "ต้องเลือกสกิลให้ครบ 3 อัน"
	end
	local seen = {}
	for i = 1, 3 do
		local id = skills[i]
		if type(id) ~= "string" or not sub.SkillById[id] then
			return false, "มีสกิลที่ไม่อยู่ในสายนี้"
		end
		if seen[id] then
			return false, "เลือกสกิลซ้ำไม่ได้"
		end
		seen[id] = true
	end
	return true, nil
end

return Classes
