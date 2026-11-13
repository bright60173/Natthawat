-- leaderstats: Kills / Deaths / Streak
local Players = game:GetService("Players")

local StatsService = {}

local function getStat(player, name)
	local folder = player:FindFirstChild("leaderstats")
	return folder and folder:FindFirstChild(name)
end

local function setup(player)
	if player:FindFirstChild("leaderstats") then
		return
	end
	local folder = Instance.new("Folder")
	folder.Name = "leaderstats"
	for _, name in ipairs({ "Kills", "Deaths", "Streak" }) do
		local value = Instance.new("IntValue")
		value.Name = name
		value.Parent = folder
	end
	folder.Parent = player
end

-- เพิ่มคิล แล้วคืนค่า streak ปัจจุบัน
function StatsService.AddKill(player)
	local kills = getStat(player, "Kills")
	local streak = getStat(player, "Streak")
	if not kills or not streak then
		return 0
	end
	kills.Value += 1
	streak.Value += 1
	return streak.Value
end

function StatsService.AddDeath(player)
	local deaths = getStat(player, "Deaths")
	local streak = getStat(player, "Streak")
	if deaths then
		deaths.Value += 1
	end
	if streak then
		streak.Value = 0
	end
end

function StatsService.Init()
	Players.PlayerAdded:Connect(setup)
	for _, player in ipairs(Players:GetPlayers()) do
		setup(player)
	end
end

return StatsService
