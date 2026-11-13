-- ตัวช่วยสร้าง UI และสีที่ใช้ร่วมกัน
local Workspace = game:GetService("Workspace")

local Theme = {}

Theme.Background = Color3.fromRGB(12, 13, 22)
Theme.Panel = Color3.fromRGB(24, 26, 40)
Theme.PanelLight = Color3.fromRGB(38, 41, 60)
Theme.Text = Color3.fromRGB(240, 244, 255)
Theme.SubText = Color3.fromRGB(165, 172, 200)
Theme.Accent = Color3.fromRGB(0, 255, 213)
Theme.Danger = Color3.fromRGB(255, 80, 90)
Theme.Font = Enum.Font.GothamMedium
Theme.FontBold = Enum.Font.GothamBold
Theme.FontBlack = Enum.Font.GothamBlack

Theme.DesignSize = Vector2.new(1280, 720)

-- สร้าง Instance พร้อมตั้งค่าและลูก
function Theme.New(className, props, children)
	local instance = Instance.new(className)
	local parent
	for key, value in pairs(props or {}) do
		if key == "Parent" then
			parent = value
		else
			instance[key] = value
		end
	end
	for _, child in ipairs(children or {}) do
		child.Parent = instance
	end
	if parent then
		instance.Parent = parent
	end
	return instance
end

function Theme.Corner(radius)
	return Theme.New("UICorner", { CornerRadius = UDim.new(0, radius or 10) })
end

function Theme.Round()
	return Theme.New("UICorner", { CornerRadius = UDim.new(1, 0) })
end

function Theme.Stroke(color, thickness, transparency)
	return Theme.New("UIStroke", {
		Color = color,
		Thickness = thickness or 2,
		Transparency = transparency or 0,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	})
end

function Theme.Label(props)
	local defaults = {
		BackgroundTransparency = 1,
		Font = Theme.Font,
		TextColor3 = Theme.Text,
		TextSize = 18,
		TextWrapped = true,
	}
	for key, value in pairs(props) do
		defaults[key] = value
	end
	return Theme.New("TextLabel", defaults)
end

-- ทำให้สีเข้มมากอ่านออกบนพื้นมืด
function Theme.Readable(color)
	local h, s, v = color:ToHSV()
	return Color3.fromHSV(h, s * 0.85, math.max(v, 0.8))
end

-- กรอบหลักที่ย่อ/ขยายตามขนาดจอด้วย UIScale (ออกแบบที่ 1280×720)
function Theme.ScaledRoot(screenGui, name)
	local root = Theme.New("Frame", {
		Name = name or "Root",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromScale(1, 1),
		Parent = screenGui,
	})
	local scale = Theme.New("UIScale", { Parent = root })

	local function update()
		local camera = Workspace.CurrentCamera
		local viewport = camera and camera.ViewportSize or Theme.DesignSize
		local factor = math.clamp(math.min(viewport.X / Theme.DesignSize.X, viewport.Y / Theme.DesignSize.Y), 0.45, 2)
		scale.Scale = factor
		-- ชดเชยขนาด เพื่อให้กรอบยังเต็มจอหลังถูกย่อ/ขยาย
		root.Size = UDim2.fromScale(1 / factor, 1 / factor)
	end

	local connection
	local function hook()
		if connection then
			connection:Disconnect()
		end
		local camera = Workspace.CurrentCamera
		if camera then
			connection = camera:GetPropertyChangedSignal("ViewportSize"):Connect(update)
		end
		update()
	end
	Workspace:GetPropertyChangedSignal("CurrentCamera"):Connect(hook)
	hook()
	return root
end

return Theme
