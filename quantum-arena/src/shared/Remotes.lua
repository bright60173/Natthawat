-- สร้าง (ฝั่ง server) หรืออ้างอิง (ฝั่ง client) RemoteEvent ทั้งหมดของเกม
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local NAMES = {
	"SelectLoadout", -- C→S: subclassId, {skillId×3}
	"UseSkill", -- C→S: slot (0=basic, 1–3, "dash"), aimPosition
	"ReturnToLobby", -- C→S: ขอกลับ Lobby เพื่อเปลี่ยนสาย
	"SkillFeedback", -- S→C: ผลการใช้สกิล / คูลดาวน์ / ตัวเลขดาเมจ
	"PlayVFX", -- S→All: effectId, data
	"KillFeed", -- S→All: killer, victim, skillName, assists
	"Announce", -- S→All: ข้อความประกาศ, สี
}

local Remotes = {}

local folder
if RunService:IsServer() then
	folder = ReplicatedStorage:FindFirstChild("Remotes")
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = "Remotes"
		folder.Parent = ReplicatedStorage
	end
	for _, name in ipairs(NAMES) do
		local remote = folder:FindFirstChild(name)
		if not remote then
			remote = Instance.new("RemoteEvent")
			remote.Name = name
			remote.Parent = folder
		end
		Remotes[name] = remote
	end
else
	folder = ReplicatedStorage:WaitForChild("Remotes")
	for _, name in ipairs(NAMES) do
		Remotes[name] = folder:WaitForChild(name)
	end
end

return Remotes
