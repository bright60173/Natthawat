-- HUD: แถบเลือด, ช่องสกิล + คูลดาวน์, ไอคอนพุ่งหลบ, ชื่อสายย่อย, ข้อความแจ้งเตือน
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Classes = require(Shared:WaitForChild("Classes"))
local Config = require(Shared:WaitForChild("Config"))
local Remotes = require(Shared:WaitForChild("Remotes"))

local Theme = require(script.Parent.Theme)
local New = Theme.New

local player = Players.LocalPlayer

local HUD = {}

local SLOT_SIZE = 74

-- ช่องสกิลทรงกลม พร้อมม่านคูลดาวน์แบบทึบที่ค่อย ๆ ลดลง
local function makeSlot(parent, keyText, order)
	local slot = New("Frame", {
		Name = "Slot" .. keyText,
		LayoutOrder = order,
		Size = UDim2.fromOffset(SLOT_SIZE, SLOT_SIZE),
		BackgroundColor3 = Theme.Panel,
		Parent = parent,
	}, {
		Theme.Round(),
		New("UIAspectRatioConstraint", { AspectRatio = 1 }),
	})
	local stroke = Theme.Stroke(Theme.Accent, 3)
	stroke.Parent = slot

	local icon = Theme.Label({
		Name = "Icon",
		Size = UDim2.fromScale(1, 1),
		Font = Theme.FontBold,
		TextSize = 34,
		Text = "",
		Parent = slot,
	})

	-- ม่านคูลดาวน์: กรอบตัดขอบที่สูงตามสัดส่วนเวลาที่เหลือ ข้างในเป็นวงกลมทึบ
	local clip = New("Frame", {
		Name = "CooldownClip",
		BackgroundTransparency = 1,
		ClipsDescendants = true,
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.fromScale(0, 1),
		Size = UDim2.fromScale(1, 0),
		ZIndex = 2,
		Parent = slot,
	})
	New("Frame", {
		Name = "Shade",
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.fromScale(0, 1),
		Size = UDim2.fromOffset(SLOT_SIZE, SLOT_SIZE),
		BackgroundColor3 = Color3.fromRGB(5, 5, 10),
		BackgroundTransparency = 0.15,
		ZIndex = 2,
		Parent = clip,
	}, { Theme.Round() })

	local timer = Theme.Label({
		Name = "Timer",
		Size = UDim2.fromScale(1, 1),
		Font = Theme.FontBlack,
		TextSize = 26,
		Text = "",
		ZIndex = 3,
		Parent = slot,
	})

	local key = Theme.Label({
		Name = "Key",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 1, 4),
		Size = UDim2.fromOffset(SLOT_SIZE + 30, 18),
		Font = Theme.FontBold,
		TextSize = 14,
		TextColor3 = Theme.SubText,
		TextWrapped = false,
		Text = keyText,
		Parent = slot,
	})

	return { Frame = slot, Stroke = stroke, Icon = icon, Clip = clip, Timer = timer, Key = key }
end

local function setCooldown(slot, entry)
	if entry and entry.Remaining > 0.05 then
		slot.Clip.Size = UDim2.fromScale(1, math.clamp(entry.Remaining / math.max(entry.Total, 0.05), 0, 1))
		slot.Timer.Text = entry.Total >= 1 and string.format(entry.Remaining >= 10 and "%d" or "%.1f", entry.Remaining) or ""
	else
		slot.Clip.Size = UDim2.fromScale(1, 0)
		slot.Timer.Text = ""
	end
end

function HUD.Init(InputController)
	local gui = New("ScreenGui", {
		Name = "QA_HUD",
		ResetOnSpawn = false,
		IgnoreGuiInset = true,
		DisplayOrder = 5,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		Parent = player:WaitForChild("PlayerGui"),
	})
	local root = Theme.ScaledRoot(gui)
	local isTouch = InputController.IsTouch

	-----------------------------------------------------------------------
	-- แถบล่าง: ชื่อสาย + ช่องสกิล + แถบเลือด
	-----------------------------------------------------------------------
	local bottom = New("Frame", {
		Name = "Bottom",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -18),
		Size = UDim2.fromOffset(460, 190),
		Parent = root,
	})

	local subLabel = Theme.Label({
		Name = "Subclass",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -40),
		Size = UDim2.fromOffset(460, 24),
		Font = Theme.FontBold,
		TextSize = 18,
		TextStrokeTransparency = 0.5,
		Text = "",
		Parent = bottom,
	})

	local slotRow = New("Frame", {
		Name = "Slots",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -92),
		Size = UDim2.fromOffset(460, SLOT_SIZE),
		Visible = not isTouch, -- มือถือมีปุ่มบนจอที่แสดงคูลดาวน์อยู่แล้ว
		Parent = bottom,
	}, {
		New("UIListLayout", {
			FillDirection = Enum.FillDirection.Horizontal,
			HorizontalAlignment = Enum.HorizontalAlignment.Center,
			VerticalAlignment = Enum.VerticalAlignment.Center,
			SortOrder = Enum.SortOrder.LayoutOrder,
			Padding = UDim.new(0, 18),
		}),
	})

	local slots = {
		dash = makeSlot(slotRow, "Shift", 1),
		["1"] = makeSlot(slotRow, "Q", 2),
		["2"] = makeSlot(slotRow, "E", 3),
		["3"] = makeSlot(slotRow, "R", 4),
	}
	slots.dash.Icon.Text = "💨"
	slots.dash.Stroke.Color = Theme.SubText

	local barBack = New("Frame", {
		Name = "Health",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.fromScale(0.5, 1),
		Size = UDim2.fromOffset(420, 28),
		BackgroundColor3 = Color3.fromRGB(16, 17, 26),
		Parent = bottom,
	}, { Theme.Corner(8), Theme.Stroke(Color3.fromRGB(70, 75, 100), 2) })

	local ghost = New("Frame", {
		Name = "Ghost",
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 0.4,
		Parent = barBack,
	}, { Theme.Corner(8) })
	local fill = New("Frame", {
		Name = "Fill",
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.fromRGB(70, 220, 110),
		Parent = barBack,
	}, { Theme.Corner(8) })
	local healthText = Theme.Label({
		Name = "Text",
		Size = UDim2.fromScale(1, 1),
		Font = Theme.FontBold,
		TextSize = 16,
		TextStrokeTransparency = 0.4,
		Text = "",
		ZIndex = 3,
		Parent = barBack,
	})

	local ammoLabel = Theme.Label({
		Name = "Ammo",
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(1, 14, 1, 0),
		Size = UDim2.fromOffset(170, 28),
		Font = Theme.FontBold,
		TextSize = 18,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextStrokeTransparency = 0.5,
		Text = "",
		Parent = barBack,
	})

	-----------------------------------------------------------------------
	-- ข้อความกลางจอ / ประกาศ / คำแนะนำ
	-----------------------------------------------------------------------
	local notice = Theme.Label({
		Name = "Notice",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.68),
		Size = UDim2.fromOffset(600, 30),
		Font = Theme.FontBold,
		TextSize = 20,
		TextColor3 = Color3.fromRGB(255, 200, 90),
		TextStrokeTransparency = 0.4,
		TextTransparency = 1,
		Text = "",
		Parent = root,
	})

	local announce = Theme.Label({
		Name = "Announce",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 96),
		Size = UDim2.fromOffset(900, 44),
		Font = Theme.FontBlack,
		TextSize = 32,
		TextStrokeTransparency = 0.2,
		TextTransparency = 1,
		Text = "",
		Parent = root,
	})

	local hint = Theme.Label({
		Name = "Hint",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -24),
		Size = UDim2.fromOffset(700, 26),
		TextSize = 17,
		TextColor3 = Theme.SubText,
		TextStrokeTransparency = 0.6,
		Text = isTouch and "แตะ ☰ เพื่อเลือกสาย หรือเดินเข้าประตูนีออนเพื่อลงสนาม"
			or "กด Tab เพื่อเลือกสาย หรือเดินเข้าประตูนีออนเพื่อลงสนาม",
		Parent = root,
	})

	local respawn = Theme.Label({
		Name = "Respawn",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.4),
		Size = UDim2.fromOffset(600, 50),
		Font = Theme.FontBlack,
		TextSize = 34,
		TextColor3 = Theme.Danger,
		TextStrokeTransparency = 0.2,
		Visible = false,
		Text = "",
		Parent = root,
	})

	local function showNotice(text)
		notice.Text = text
		notice.TextTransparency = 0
		notice.TextStrokeTransparency = 0.4
		TweenService:Create(notice, TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In, 0, false, 1.2), {
			TextTransparency = 1,
			TextStrokeTransparency = 1,
		}):Play()
	end
	HUD.ShowNotice = showNotice

	-----------------------------------------------------------------------
	-- อัปเดตข้อมูลสาย / เลือด
	-----------------------------------------------------------------------
	local function refreshLoadout()
		local sub = Classes.GetSubclass(player:GetAttribute("Subclass"))
		if not sub then
			return
		end
		local color = Theme.Readable(sub.Color)
		subLabel.Text = string.format("%s %s", sub.Icon or "", sub.DisplayName)
		subLabel.TextColor3 = color
		for i = 1, 3 do
			local skill = sub.SkillById[player:GetAttribute("Skill" .. i) or ""]
			local slot = slots[tostring(i)]
			slot.Icon.Text = skill and skill.Icon or "?"
			slot.Stroke.Color = color
			if not isTouch then
				slot.Key.Text = string.format("%s  %s", ({ "Q", "E", "R" })[i], skill and skill.Name or "")
			end
		end
	end
	for _, name in ipairs({ "Subclass", "Skill1", "Skill2", "Skill3" }) do
		player:GetAttributeChangedSignal(name):Connect(refreshLoadout)
	end
	refreshLoadout()

	local function refreshArena()
		local inArena = player:GetAttribute("InArena") == true
		bottom.Visible = inArena
		hint.Visible = not inArena
	end
	player:GetAttributeChangedSignal("InArena"):Connect(refreshArena)
	refreshArena()

	local function refreshAmmo()
		local ammo = player:GetAttribute("Ammo")
		if player:GetAttribute("Reloading") then
			ammoLabel.Text = "🔄 กำลังรีโหลด..."
		elseif ammo then
			ammoLabel.Text = string.format("🔫 %d / 20", ammo)
		else
			ammoLabel.Text = ""
		end
	end
	player:GetAttributeChangedSignal("Ammo"):Connect(refreshAmmo)
	player:GetAttributeChangedSignal("Reloading"):Connect(refreshAmmo)

	local function bindCharacter(character)
		local humanoid = character:WaitForChild("Humanoid", 10)
		if not humanoid then
			return
		end
		respawn.Visible = false
		local function update()
			local maxHealth = math.max(humanoid.MaxHealth, 1)
			local ratio = math.clamp(humanoid.Health / maxHealth, 0, 1)
			healthText.Text = string.format("%d / %d", math.ceil(humanoid.Health), maxHealth)
			fill.BackgroundColor3 = Color3.fromRGB(70, 220, 110):Lerp(Color3.fromRGB(240, 70, 70), 1 - ratio)
			TweenService:Create(fill, TweenInfo.new(0.15), { Size = UDim2.fromScale(ratio, 1) }):Play()
			TweenService:Create(ghost, TweenInfo.new(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out, 0, false, 0.15), {
				Size = UDim2.fromScale(ratio, 1),
			}):Play()
		end
		humanoid.HealthChanged:Connect(update)
		humanoid:GetPropertyChangedSignal("MaxHealth"):Connect(update)
		update()
		humanoid.Died:Connect(function()
			respawn.Visible = true
			for remaining = Config.RespawnTime, 1, -1 do
				if player.Character ~= character then
					break
				end
				respawn.Text = string.format("คุณตายแล้ว — เกิดใหม่ใน %d", remaining)
				task.wait(1)
			end
			respawn.Visible = false
		end)
	end
	player.CharacterAdded:Connect(bindCharacter)
	if player.Character then
		task.spawn(bindCharacter, player.Character)
	end

	-----------------------------------------------------------------------
	-- ข้อความจาก server
	-----------------------------------------------------------------------
	Remotes.SkillFeedback.OnClientEvent:Connect(function(message)
		if type(message) ~= "table" then
			return
		end
		if message.Type == "Denied" and message.Reason then
			showNotice(message.Reason)
		elseif message.Type == "Notice" and message.Text then
			showNotice(message.Text)
		end
	end)

	Remotes.Announce.OnClientEvent:Connect(function(text, color)
		announce.Text = tostring(text)
		announce.TextColor3 = typeof(color) == "Color3" and Theme.Readable(color) or Theme.Text
		announce.TextTransparency = 0
		announce.TextStrokeTransparency = 0.2
		TweenService:Create(announce, TweenInfo.new(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.In, 0, false, 3), {
			TextTransparency = 1,
			TextStrokeTransparency = 1,
		}):Play()
	end)

	RunService.RenderStepped:Connect(function()
		for key, slot in pairs(slots) do
			setCooldown(slot, InputController.Cooldowns[key])
		end
	end)
end

return HUD
