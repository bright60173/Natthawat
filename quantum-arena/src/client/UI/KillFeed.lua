-- Kill feed มุมขวาบน: "[ผู้ฆ่า] ⚡ [ชื่อสกิล] → [ผู้ตาย]" แสดง 5 บรรทัดล่าสุด หายไปใน 6 วิ
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Remotes = require(Shared:WaitForChild("Remotes"))

local Theme = require(script.Parent.Theme)
local New = Theme.New

local player = Players.LocalPlayer

local KillFeed = {}

function KillFeed.Init()
	local gui = New("ScreenGui", {
		Name = "QA_KillFeed",
		ResetOnSpawn = false,
		DisplayOrder = 4,
		Parent = player:WaitForChild("PlayerGui"),
	})
	local root = Theme.ScaledRoot(gui)

	local list = New("Frame", {
		Name = "List",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -14, 0, 190),
		Size = UDim2.fromOffset(440, 200),
		Parent = root,
	}, {
		New("UIListLayout", {
			HorizontalAlignment = Enum.HorizontalAlignment.Right,
			SortOrder = Enum.SortOrder.LayoutOrder,
			Padding = UDim.new(0, 5),
		}),
	})

	local lines = {}
	local counter = 0

	local function removeLine(line)
		local index = table.find(lines, line)
		if index then
			table.remove(lines, index)
		end
		line:Destroy()
	end

	local function addLine(text, highlight)
		counter += 1
		local line = New("TextLabel", {
			LayoutOrder = counter,
			AutomaticSize = Enum.AutomaticSize.X,
			Size = UDim2.fromOffset(0, 30),
			BackgroundColor3 = highlight and Color3.fromRGB(70, 30, 40) or Theme.Background,
			BackgroundTransparency = 0.25,
			Font = Theme.FontBold,
			TextSize = 16,
			TextColor3 = Theme.Text,
			RichText = true,
			Text = text,
			Parent = list,
		}, {
			Theme.Corner(6),
			New("UIPadding", { PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10) }),
		})
		table.insert(lines, line)
		while #lines > Config.KillFeed.MaxLines do
			removeLine(lines[1])
		end
		task.delay(Config.KillFeed.Lifetime - 0.5, function()
			if line.Parent then
				TweenService:Create(line, TweenInfo.new(0.5), { TextTransparency = 1, BackgroundTransparency = 1 }):Play()
				task.wait(0.5)
				if line.Parent then
					removeLine(line)
				end
			end
		end)
	end

	-- กันอักขระพิเศษของ RichText ในชื่อผู้เล่น
	local function escape(text)
		return (tostring(text):gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"))
	end

	Remotes.KillFeed.OnClientEvent:Connect(function(killer, victim, skillName, assists)
		local mine = killer == player.DisplayName or victim == player.DisplayName
		local text
		if killer then
			text = string.format(
				'<font color="#7CFFB2">%s</font> ⚡ <font color="#FFD45A">%s</font> → <font color="#FF7A85">%s</font>',
				escape(killer),
				escape(skillName or "โจมตี"),
				escape(victim)
			)
			if type(assists) == "table" and #assists > 0 then
				local names = {}
				for _, name in ipairs(assists) do
					table.insert(names, escape(name))
				end
				text ..= string.format(' <font color="#A5ACC8">(ช่วย: %s)</font>', table.concat(names, ", "))
			end
		else
			text = string.format('☠ <font color="#FF7A85">%s</font> %s', escape(victim), escape(skillName or "ตาย"))
		end
		addLine(text, mine)
	end)
end

return KillFeed
