-- ปุ่มบนจอสำหรับมือถือ/แท็บเล็ต (แสดงเฉพาะเครื่องที่มีจอสัมผัส)
-- ปุ่มวงกลมขนาด ≥ 70px อยู่ด้านขวา จัดวางหลบปุ่มกระโดดของ Roblox
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Classes = require(Shared:WaitForChild("Classes"))

local Theme = require(script.Parent.Theme)
local New = Theme.New

local player = Players.LocalPlayer

local MobileButtons = {}

local function makeButton(parent, name, size, offset, text)
	local button = New("TextButton", {
		Name = name,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(1, offset.X, 1, offset.Y),
		Size = UDim2.fromOffset(size, size),
		BackgroundColor3 = Theme.Panel,
		BackgroundTransparency = 0.25,
		AutoButtonColor = false,
		Font = Theme.FontBold,
		TextSize = math.floor(size * 0.45),
		TextColor3 = Theme.Text,
		Text = text,
		Parent = parent,
	}, {
		Theme.Round(),
		New("UIAspectRatioConstraint", { AspectRatio = 1 }),
	})
	local stroke = Theme.Stroke(Theme.Accent, 3, 0.1)
	stroke.Parent = button

	local clip = New("Frame", {
		Name = "CooldownClip",
		BackgroundTransparency = 1,
		ClipsDescendants = true,
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.fromScale(0, 1),
		Size = UDim2.fromScale(1, 0),
		ZIndex = 2,
		Parent = button,
	})
	New("Frame", {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.fromScale(0, 1),
		Size = UDim2.fromOffset(size, size),
		BackgroundColor3 = Color3.fromRGB(5, 5, 10),
		BackgroundTransparency = 0.2,
		ZIndex = 2,
		Parent = clip,
	}, { Theme.Round() })
	local timer = Theme.Label({
		Name = "Timer",
		Size = UDim2.fromScale(1, 1),
		Font = Theme.FontBlack,
		TextSize = math.floor(size * 0.32),
		Text = "",
		ZIndex = 3,
		Parent = button,
	})
	return { Button = button, Stroke = stroke, Clip = clip, Timer = timer }
end

function MobileButtons.Init(InputController)
	if not InputController.IsTouch then
		return
	end

	local gui = New("ScreenGui", {
		Name = "QA_MobileButtons",
		ResetOnSpawn = false,
		DisplayOrder = 6,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		Parent = player:WaitForChild("PlayerGui"),
	})

	-- กลุ่มปุ่มต่อสู้ (แสดงเฉพาะตอนอยู่ในสนาม)
	local combat = New("Frame", {
		Name = "Combat",
		BackgroundTransparency = 1,
		Size = UDim2.fromScale(1, 1),
		Parent = gui,
	})

	-- ตำแหน่งนับจากมุมขวาล่าง: เว้นพื้นที่ปุ่มกระโดดของ Roblox (ราว 190×230px ที่มุม)
	local buttons = {
		["0"] = makeButton(combat, "Attack", 96, Vector2.new(-250, -80), "⚔"),
		dash = makeButton(combat, "Dash", 72, Vector2.new(-355, -70), "💨"),
		["1"] = makeButton(combat, "Skill1", 76, Vector2.new(-290, -185), "1"),
		["2"] = makeButton(combat, "Skill2", 76, Vector2.new(-195, -265), "2"),
		["3"] = makeButton(combat, "Skill3", 76, Vector2.new(-85, -305), "3"),
	}

	buttons["0"].Button.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then
			InputController.SetHoldingBasic(true)
		end
	end)
	buttons["0"].Button.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then
			InputController.SetHoldingBasic(false)
		end
	end)
	buttons.dash.Button.Activated:Connect(function()
		InputController.Trigger("dash")
	end)
	for slot = 1, 3 do
		buttons[tostring(slot)].Button.Activated:Connect(function()
			InputController.Trigger(slot)
		end)
	end

	-- ปุ่ม ☰ มุมบน: เปิดหน้าเลือกสาย (ใน Lobby) / กลับ Lobby (ในสนาม)
	local menu = New("TextButton", {
		Name = "Menu",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 8),
		Size = UDim2.fromOffset(74, 74),
		BackgroundColor3 = Theme.Panel,
		BackgroundTransparency = 0.25,
		Font = Theme.FontBold,
		TextSize = 34,
		TextColor3 = Theme.Text,
		Text = "☰",
		Parent = gui,
	}, { Theme.Round(), New("UIAspectRatioConstraint", { AspectRatio = 1 }), Theme.Stroke(Theme.SubText, 2, 0.2) })
	menu.Activated:Connect(function()
		InputController.OpenMenu()
	end)

	local function refreshLoadout()
		local sub = Classes.GetSubclass(player:GetAttribute("Subclass"))
		if not sub then
			return
		end
		local color = Theme.Readable(sub.Color)
		buttons["0"].Stroke.Color = color
		for i = 1, 3 do
			local skill = sub.SkillById[player:GetAttribute("Skill" .. i) or ""]
			local entry = buttons[tostring(i)]
			entry.Button.Text = skill and skill.Icon or tostring(i)
			entry.Stroke.Color = color
		end
	end
	for _, name in ipairs({ "Subclass", "Skill1", "Skill2", "Skill3" }) do
		player:GetAttributeChangedSignal(name):Connect(refreshLoadout)
	end
	refreshLoadout()

	local function refreshArena()
		combat.Visible = player:GetAttribute("InArena") == true
		if not combat.Visible then
			InputController.SetHoldingBasic(false)
		end
	end
	player:GetAttributeChangedSignal("InArena"):Connect(refreshArena)
	refreshArena()

	RunService.RenderStepped:Connect(function()
		for key, entry in pairs(buttons) do
			local cooldown = InputController.Cooldowns[key]
			if key ~= "0" and cooldown and cooldown.Remaining > 0.05 then
				entry.Clip.Size = UDim2.fromScale(1, math.clamp(cooldown.Remaining / math.max(cooldown.Total, 0.05), 0, 1))
				entry.Timer.Text = string.format(cooldown.Remaining >= 10 and "%d" or "%.1f", cooldown.Remaining)
			else
				entry.Clip.Size = UDim2.fromScale(1, 0)
				entry.Timer.Text = ""
			end
		end
	end)
end

return MobileButtons
