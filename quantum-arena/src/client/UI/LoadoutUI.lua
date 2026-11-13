-- หน้าเลือกสาย 3 ขั้น: สายใหญ่ → สายย่อย → สกิล 3 จาก 5
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Classes = require(Shared:WaitForChild("Classes"))
local Remotes = require(Shared:WaitForChild("Remotes"))

local Theme = require(script.Parent.Theme)
local New = Theme.New

local player = Players.LocalPlayer

local LoadoutUI = {}

local gui, content, titleLabel, subtitleLabel, backButton, errorLabel, footer
local isOpen = false
local step = 1
local chosenCategory, chosenSubclass
local chosenSkills = {} -- ลำดับที่กด = ช่อง Q / E / R
local SLOT_KEYS = { "Q", "E", "R" }

local render -- ประกาศล่วงหน้า

local function clear(frame)
	for _, child in ipairs(frame:GetChildren()) do
		if child:IsA("GuiObject") then
			child:Destroy()
		end
	end
end

-- การ์ดกดได้ พร้อมแถบสีด้านบน
local function card(parent, size, color, order)
	local button = New("TextButton", {
		LayoutOrder = order,
		Size = size,
		BackgroundColor3 = Theme.Panel,
		AutoButtonColor = false,
		Text = "",
		Parent = parent,
	}, {
		Theme.Corner(14),
		New("UIAspectRatioConstraint", { AspectRatio = size.X.Offset / size.Y.Offset }),
	})
	local stroke = Theme.Stroke(color, 2, 0.35)
	stroke.Parent = button
	New("Frame", {
		Name = "Stripe",
		Size = UDim2.new(1, 0, 0, 8),
		BackgroundColor3 = color,
		BorderSizePixel = 0,
		Parent = button,
	}, { Theme.Corner(14) })
	button.MouseEnter:Connect(function()
		button.BackgroundColor3 = Theme.PanelLight
	end)
	button.MouseLeave:Connect(function()
		button.BackgroundColor3 = Theme.Panel
	end)
	return button, stroke
end

local function text(parent, props)
	props.Parent = parent
	return Theme.Label(props)
end

---------------------------------------------------------------------------
-- ขั้น 1: สายใหญ่
---------------------------------------------------------------------------
local function renderCategories()
	titleLabel.Text = "เลือกสายใหญ่"
	subtitleLabel.Text = "ขั้นที่ 1 / 3"
	for index, category in ipairs(Classes.Categories) do
		local color = Theme.Readable(category.Color)
		local button = card(content, UDim2.fromOffset(330, 400), color, index)
		text(button, { Position = UDim2.fromOffset(0, 34), Size = UDim2.new(1, 0, 0, 110), TextSize = 84, Text = category.Icon })
		text(button, {
			Position = UDim2.fromOffset(0, 150),
			Size = UDim2.new(1, 0, 0, 44),
			Font = Theme.FontBlack,
			TextSize = 36,
			TextColor3 = color,
			Text = category.DisplayName,
		})
		text(button, {
			Position = UDim2.fromOffset(24, 200),
			Size = UDim2.new(1, -48, 0, 70),
			TextSize = 18,
			TextColor3 = Theme.SubText,
			Text = category.Description,
		})
		local names = {}
		for _, subId in ipairs(category.Subclasses) do
			local sub = Classes.Subclasses[subId]
			table.insert(names, string.format("%s %s", sub.Icon or "", sub.DisplayName))
		end
		text(button, {
			Position = UDim2.fromOffset(24, 284),
			Size = UDim2.new(1, -48, 0, 96),
			Font = Theme.FontBold,
			TextSize = 19,
			Text = table.concat(names, "\n"),
		})
		button.Activated:Connect(function()
			chosenCategory = category
			step = 2
			render()
		end)
	end
end

---------------------------------------------------------------------------
-- ขั้น 2: สายย่อย
---------------------------------------------------------------------------
local function renderSubclasses()
	titleLabel.Text = string.format("%s %s — เลือกสายย่อย", chosenCategory.Icon, chosenCategory.DisplayName)
	subtitleLabel.Text = "ขั้นที่ 2 / 3"
	for index, subId in ipairs(chosenCategory.Subclasses) do
		local sub = Classes.Subclasses[subId]
		local color = Theme.Readable(sub.Color)
		local button = card(content, UDim2.fromOffset(330, 400), color, index)
		text(button, { Position = UDim2.fromOffset(0, 30), Size = UDim2.new(1, 0, 0, 96), TextSize = 72, Text = sub.Icon or "" })
		text(button, {
			Position = UDim2.fromOffset(0, 132),
			Size = UDim2.new(1, 0, 0, 42),
			Font = Theme.FontBlack,
			TextSize = 32,
			TextColor3 = color,
			Text = sub.DisplayName,
		})
		text(button, {
			Position = UDim2.fromOffset(24, 180),
			Size = UDim2.new(1, -48, 0, 78),
			TextSize = 18,
			TextColor3 = Theme.SubText,
			Text = sub.Description,
		})
		local basic = sub.Basic
		local damage = type(basic.Damage) == "table" and table.concat(basic.Damage, "/") or tostring(basic.Damage)
		New("Frame", {
			Position = UDim2.fromOffset(20, 272),
			Size = UDim2.new(1, -40, 0, 104),
			BackgroundColor3 = Theme.Background,
			BackgroundTransparency = 0.3,
			Parent = button,
		}, {
			Theme.Corner(10),
			Theme.Label({
				Position = UDim2.fromOffset(12, 8),
				Size = UDim2.new(1, -24, 0, 24),
				Font = Theme.FontBold,
				TextSize = 17,
				TextXAlignment = Enum.TextXAlignment.Left,
				Text = "โจมตีปกติ: " .. basic.Name,
			}),
			Theme.Label({
				Position = UDim2.fromOffset(12, 36),
				Size = UDim2.new(1, -24, 0, 60),
				TextSize = 16,
				TextColor3 = Theme.SubText,
				TextXAlignment = Enum.TextXAlignment.Left,
				TextYAlignment = Enum.TextYAlignment.Top,
				Text = string.format("DMG %s   ระยะ %d%s", damage, basic.Range, sub.DoubleJump and "\n+ กระโดดได้ 2 ครั้ง" or ""),
			}),
		})
		button.Activated:Connect(function()
			if chosenSubclass ~= sub then
				chosenSkills = {}
			end
			chosenSubclass = sub
			step = 3
			render()
		end)
	end
end

---------------------------------------------------------------------------
-- ขั้น 3: สกิล 3 จาก 5
---------------------------------------------------------------------------
local function renderSkills()
	local sub = chosenSubclass
	local color = Theme.Readable(sub.Color)
	titleLabel.Text = string.format("%s %s — เลือกสกิล 3 จาก 5", sub.Icon or "", sub.DisplayName)
	subtitleLabel.Text = "ขั้นที่ 3 / 3 · ลำดับที่กด = ช่อง Q / E / R"

	local badges = {}
	local strokes = {}
	local deployButton

	local function refresh()
		for skillId, badge in pairs(badges) do
			local index = table.find(chosenSkills, skillId)
			badge.Visible = index ~= nil
			badge.Text = index and string.format("%d · %s", index, SLOT_KEYS[index]) or ""
			strokes[skillId].Transparency = index and 0 or 0.6
			strokes[skillId].Thickness = index and 4 or 2
		end
		local ready = #chosenSkills == 3
		deployButton.BackgroundColor3 = ready and color or Theme.PanelLight
		deployButton.TextColor3 = ready and Color3.fromRGB(10, 10, 16) or Theme.SubText
		deployButton.Text = ready and "⚔ ลงสนาม" or string.format("เลือกอีก %d สกิล", 3 - #chosenSkills)
	end

	for index, skill in ipairs(sub.Skills) do
		local button, stroke = card(content, UDim2.fromOffset(226, 400), color, index)
		strokes[skill.Id] = stroke
		text(button, { Position = UDim2.fromOffset(0, 26), Size = UDim2.new(1, 0, 0, 70), TextSize = 52, Text = skill.Icon or "" })
		text(button, {
			Position = UDim2.fromOffset(8, 100),
			Size = UDim2.new(1, -16, 0, 52),
			Font = Theme.FontBold,
			TextSize = 22,
			TextColor3 = color,
			Text = skill.Name,
		})
		text(button, {
			Position = UDim2.fromOffset(14, 156),
			Size = UDim2.new(1, -28, 0, 150),
			TextSize = 15,
			TextColor3 = Theme.SubText,
			TextYAlignment = Enum.TextYAlignment.Top,
			Text = skill.Description,
		})
		New("Frame", {
			AnchorPoint = Vector2.new(0.5, 1),
			Position = UDim2.new(0.5, 0, 1, -14),
			Size = UDim2.new(1, -24, 0, 66),
			BackgroundColor3 = Theme.Background,
			BackgroundTransparency = 0.3,
			Parent = button,
		}, {
			Theme.Corner(10),
			Theme.Label({
				Position = UDim2.fromOffset(0, 6),
				Size = UDim2.new(1, 0, 0, 26),
				Font = Theme.FontBold,
				TextSize = 17,
				Text = "DMG " .. (skill.DamageText or "–"),
			}),
			Theme.Label({
				Position = UDim2.fromOffset(0, 34),
				Size = UDim2.new(1, 0, 0, 26),
				Font = Theme.FontBold,
				TextSize = 17,
				TextColor3 = Color3.fromRGB(140, 200, 255),
				Text = string.format("CD %d วิ", skill.Cooldown),
			}),
		})
		badges[skill.Id] = Theme.Label({
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -10, 0, 18),
			Size = UDim2.fromOffset(74, 32),
			BackgroundTransparency = 0,
			BackgroundColor3 = color,
			Font = Theme.FontBlack,
			TextSize = 18,
			TextColor3 = Color3.fromRGB(10, 10, 16),
			Visible = false,
			ZIndex = 3,
			Parent = button,
		})
		Theme.Corner(8).Parent = badges[skill.Id]

		button.Activated:Connect(function()
			local existing = table.find(chosenSkills, skill.Id)
			if existing then
				table.remove(chosenSkills, existing)
			elseif #chosenSkills < 3 then
				table.insert(chosenSkills, skill.Id)
			end
			errorLabel.Text = ""
			refresh()
		end)
	end

	deployButton = New("TextButton", {
		Name = "Deploy",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(340, 62),
		Font = Theme.FontBlack,
		TextSize = 26,
		AutoButtonColor = true,
		Parent = footer,
	}, { Theme.Corner(14) })
	deployButton.Activated:Connect(function()
		if #chosenSkills ~= 3 then
			return
		end
		errorLabel.Text = ""
		Remotes.SelectLoadout:FireServer(sub.Id, { chosenSkills[1], chosenSkills[2], chosenSkills[3] })
	end)
	refresh()
end

function render()
	clear(content)
	clear(footer)
	errorLabel.Text = ""
	backButton.Visible = step > 1
	if step == 1 then
		renderCategories()
	elseif step == 2 then
		renderSubclasses()
	else
		renderSkills()
	end
end

---------------------------------------------------------------------------
-- เปิด / ปิด
---------------------------------------------------------------------------
function LoadoutUI.IsOpen()
	return isOpen
end

function LoadoutUI.Open()
	if isOpen or player:GetAttribute("InArena") then
		return
	end
	isOpen = true
	-- ถ้ามีชุดเดิมอยู่ ให้เปิดที่ขั้นเลือกสกิลของสายเดิมพร้อมติ๊กสกิลเดิมไว้
	local sub = Classes.GetSubclass(player:GetAttribute("Subclass"))
	if sub and (player:GetAttribute("HasSaved") or player:GetAttribute("HasChosen")) then
		chosenSubclass = sub
		chosenCategory = Classes.GetCategory(sub.Category)
		chosenSkills = {}
		for i = 1, 3 do
			local id = player:GetAttribute("Skill" .. i)
			if id and sub.SkillById[id] then
				table.insert(chosenSkills, id)
			end
		end
		step = 3
	else
		step = 1
	end
	render()
	gui.Enabled = true
end

function LoadoutUI.Close()
	isOpen = false
	if gui then
		gui.Enabled = false
	end
end

function LoadoutUI.Toggle()
	if isOpen then
		LoadoutUI.Close()
	else
		LoadoutUI.Open()
	end
end

function LoadoutUI.Init()
	gui = New("ScreenGui", {
		Name = "QA_Loadout",
		ResetOnSpawn = false,
		IgnoreGuiInset = true,
		DisplayOrder = 20,
		Enabled = false,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		Parent = player:WaitForChild("PlayerGui"),
	})

	New("Frame", {
		Name = "Dim",
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Theme.Background,
		BackgroundTransparency = 0.12,
		Active = true,
		Parent = gui,
	})

	local root = Theme.ScaledRoot(gui)

	titleLabel = Theme.Label({
		Name = "Title",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0.5, -330),
		Size = UDim2.fromOffset(1000, 48),
		Font = Theme.FontBlack,
		TextSize = 38,
		Parent = root,
	})
	subtitleLabel = Theme.Label({
		Name = "Subtitle",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0.5, -280),
		Size = UDim2.fromOffset(1000, 26),
		TextSize = 18,
		TextColor3 = Theme.SubText,
		Parent = root,
	})

	content = New("Frame", {
		Name = "Content",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, 0, 0.5, -30),
		Size = UDim2.fromOffset(1240, 410),
		Parent = root,
	}, {
		New("UIListLayout", {
			FillDirection = Enum.FillDirection.Horizontal,
			HorizontalAlignment = Enum.HorizontalAlignment.Center,
			VerticalAlignment = Enum.VerticalAlignment.Center,
			SortOrder = Enum.SortOrder.LayoutOrder,
			Padding = UDim.new(0, 20),
		}),
	})

	errorLabel = Theme.Label({
		Name = "Error",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0.5, 184),
		Size = UDim2.fromOffset(900, 26),
		Font = Theme.FontBold,
		TextSize = 18,
		TextColor3 = Theme.Danger,
		Text = "",
		Parent = root,
	})

	footer = New("Frame", {
		Name = "Footer",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0.5, 214),
		Size = UDim2.fromOffset(1000, 80),
		Parent = root,
	})

	backButton = New("TextButton", {
		Name = "Back",
		AnchorPoint = Vector2.new(0, 0),
		Position = UDim2.new(0.5, -610, 0.5, -330),
		Size = UDim2.fromOffset(150, 48),
		BackgroundColor3 = Theme.PanelLight,
		Font = Theme.FontBold,
		TextSize = 20,
		TextColor3 = Theme.Text,
		Text = "← ย้อนกลับ",
		Parent = root,
	}, { Theme.Corner(12) })
	backButton.Activated:Connect(function()
		if step > 1 then
			step -= 1
			render()
		end
	end)

	local closeButton = New("TextButton", {
		Name = "Close",
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(0.5, 610, 0.5, -330),
		Size = UDim2.fromOffset(48, 48),
		BackgroundColor3 = Theme.PanelLight,
		Font = Theme.FontBold,
		TextSize = 22,
		TextColor3 = Theme.Text,
		Text = "✕",
		Parent = root,
	}, { Theme.Corner(12) })
	closeButton.Activated:Connect(LoadoutUI.Close)

	Remotes.SkillFeedback.OnClientEvent:Connect(function(message)
		if type(message) ~= "table" then
			return
		end
		if message.Type == "LoadoutRejected" then
			errorLabel.Text = "เลือกไม่สำเร็จ: " .. tostring(message.Reason or "")
		elseif message.Type == "LoadoutAccepted" then
			LoadoutUI.Close()
		end
	end)

	-- ลงสนามแล้วปิดหน้าเลือกสาย / กลับ Lobby แล้วเปิดให้เลือกใหม่
	player:GetAttributeChangedSignal("InArena"):Connect(function()
		if player:GetAttribute("InArena") then
			LoadoutUI.Close()
		else
			LoadoutUI.Open()
		end
	end)

	-- เกิดใน Lobby แล้วหน้าเลือกสายเด้งขึ้นมาเอง
	local function onCharacter()
		task.wait(0.5)
		if not player:GetAttribute("InArena") then
			LoadoutUI.Open()
		end
	end
	player.CharacterAdded:Connect(onCharacter)
	if player.Character then
		task.spawn(onCharacter)
	end
end

return LoadoutUI
