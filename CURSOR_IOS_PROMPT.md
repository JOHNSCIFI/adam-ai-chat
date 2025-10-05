# iOS Native App Development Prompt for Adam AI Chat

## Project Overview
Build a native iOS application (SwiftUI + Swift) that replicates the functionality of the existing web-based Adam AI Chat application. This is a sophisticated AI chat platform with multi-model support, image generation capabilities, voice interactions, and a comprehensive project management system.

**App Name:** Adam AI Chat  
**Bundle ID:** app.lovable.95b51062fa364119b5931ae2ac8718b2  
**Target iOS Version:** iOS 16.0+  
**Primary Language:** Swift  
**UI Framework:** SwiftUI  

---

## Current Web Application Technology Stack

### Frontend (Web)
- **Framework:** React 18.3.1 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom design tokens (HSL color system)
- **UI Components:** Radix UI primitives, shadcn/ui components
- **Routing:** React Router DOM v6
- **State Management:** React Context API (AuthContext, ThemeContext)
- **Data Fetching:** TanStack Query (React Query)
- **Markdown Rendering:** react-markdown with remark-gfm
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)

### Backend (Supabase)
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth (Email/Password + Google OAuth)
- **Storage:** Supabase Storage (for images and files)
- **Edge Functions:** Deno-based serverless functions
- **Real-time:** Supabase Realtime subscriptions for live message updates

### Key Backend Functions
1. **chat-with-ai-optimized** - Main chat endpoint with streaming support
2. **generate-image** - DALL-E 3 image generation
3. **save-image** - Image storage management
4. **analyze-image** - Image analysis using GPT-4 Vision
5. **text-to-speech** - Audio generation from text
6. **speech-to-text** - Voice input transcription
7. **webhook-handler** - Stripe payment processing
8. **delete-account** - Account deletion with data cleanup
9. **save-token-usage** - Usage tracking and analytics

---

## Core Features to Implement

### 1. Authentication System
**Implementation Required:**
- Email/Password authentication
- Google Sign-In (OAuth)
- Password reset flow
- Email verification
- Session management with persistent login
- Profile management (display name, avatar)
- Account deletion

**Technical Details:**
- Use Supabase Swift SDK for authentication
- Implement keychain storage for secure token management
- Handle OAuth redirect URLs properly for iOS
- Create custom URL schemes for deep linking

**User Flow:**
```
Launch → Check Auth State → 
  ├─ Not Logged In → Show Auth Modal (Login/Signup tabs)
  ├─ Google OAuth → Safari/ASWebAuthenticationSession → Callback → Home
  └─ Logged In → Main Chat Interface
```

### 2. Multi-Model AI Chat System
**Supported AI Models:**
- **GPT-4o mini** (default, free tier)
- **GPT-4o** (pro)
- **GPT-5** (pro, most advanced)
- **Claude Sonnet 4** (pro, writing tasks)
- **Gemini 2.5 Flash** (pro, fast)
- **DeepSeek V3.2** (pro, reasoning)
- **Grok 4** (pro, xAI)
- **Generate Image** (DALL-E 3 image generation)

**Model Selection UI:**
- Dropdown/Popover selector with model logos
- Display model name, description, and tier (free/pro)
- Show appropriate icons (OpenAI, Claude, Gemini, DeepSeek, Grok logos)
- Disable pro models for free users with upgrade prompt

**Chat Interface Requirements:**
- Messages displayed in conversation bubbles
- User messages: right-aligned, primary color background
- AI messages: left-aligned, secondary color background
- Markdown rendering with syntax highlighting
- Code blocks with copy button
- Image attachments (send and display)
- File attachments (PDF, TXT, DOC, etc.)
- Regenerate response button
- Copy message button
- Delete message functionality
- Message timestamps
- Typing indicator with bouncing dots animation
- Stop generation button (when AI is responding)

**Message Types:**
```swift
enum MessageRole {
    case user
    case assistant
    case system
}

struct Message {
    let id: UUID
    let conversationId: UUID
    let role: MessageRole
    let content: String
    let imageUrl: String?
    let fileUrl: String?
    let fileName: String?
    let fileType: String?
    let model: String
    let createdAt: Date
    let tokensUsed: Int?
}
```

### 3. Conversation Management
**Features:**
- Create new conversations
- List all user conversations (sidebar)
- Conversation titles (auto-generated or user-set)
- Delete conversations
- Search conversations
- Conversation history with infinite scroll
- Last message preview
- Real-time updates (new messages appear instantly)

**Sidebar Structure:**
```
┌─────────────────────────┐
│ [Menu] Adam AI Chat     │
├─────────────────────────┤
│ [+] New Chat            │
├─────────────────────────┤
│ Today                   │
│ ├ Conversation 1        │
│ └ Conversation 2        │
│                         │
│ Yesterday               │
│ ├ Conversation 3        │
│ └ Conversation 4        │
│                         │
│ Last 7 Days            │
│ └ Conversation 5        │
│                         │
│ [Settings]              │
│ [Upgrade to Pro]        │
└─────────────────────────┘
```

### 4. Image Generation System
**DALL-E 3 Integration:**
- Dedicated image generation page
- Text prompt input with preview
- Generated image display
- Save to device option
- Share functionality
- Image history
- High-resolution download

**UI Flow:**
```
Image Generation Page →
  ├─ Prompt Input (multiline textarea)
  ├─ Generate Button
  ├─ Loading State (progress indicator)
  ├─ Generated Image Display
  └─ Actions: [Download] [Share] [Generate Again]
```

### 5. Image Analysis & Vision
**Features:**
- Upload images from photo library
- Take photos with camera
- Analyze images using GPT-4 Vision
- Detailed image descriptions
- Object detection
- Text extraction (OCR)
- Image editing suggestions

**Implementation:**
- Use UIImagePickerController or PhotosPicker
- Compress images before upload
- Show upload progress
- Display analysis results in chat

### 6. Voice Interaction
**Speech-to-Text:**
- Microphone button in chat input
- Real-time audio recording
- Visual feedback (waveform animation)
- Stop recording button
- Automatic transcription
- Insert transcribed text into message input

**Text-to-Speech:**
- Read AI responses aloud
- Playback controls (play, pause, stop)
- Speed adjustment
- Voice selection (if available)

**Technical Implementation:**
- Use Supabase edge functions for transcription
- AVFoundation for audio recording
- AVSpeechSynthesizer for TTS
- Handle audio session management
- Request microphone permissions

### 7. File Management System
**Supported File Types:**
- PDF documents
- Text files (.txt, .md)
- Word documents (.doc, .docx)
- Code files (.js, .ts, .py, etc.)
- Images (.jpg, .png, .gif, .webp)

**File Upload Flow:**
```
Attachment Button → File Picker →
  ├─ Show file preview/thumbnail
  ├─ Display file name and size
  ├─ Upload to Supabase Storage
  ├─ Show upload progress
  └─ Save file reference in message
```

**File Analysis:**
- Automatic text extraction from PDFs
- Parse document content
- Send content to AI for analysis
- Display extracted text in chat

### 8. Project Management System
**Features:**
- Create projects with titles and descriptions
- Associate conversations with projects
- Project-specific chat history
- Edit project details
- Delete projects
- Project list view
- Search projects

**Data Structure:**
```swift
struct Project {
    let id: UUID
    let userId: UUID
    let title: String
    let description: String?
    let createdAt: Date
    let updatedAt: Date
    let conversationCount: Int
}
```

### 9. Settings & Preferences
**User Settings:**
- Theme selection (Light, Dark, System)
- Accent color customization
- Default AI model selection
- Voice preferences
- Notification settings
- Auto-save conversations
- Message history retention
- Language preferences

**Account Settings:**
- Display name
- Email address (view only)
- Profile picture upload
- Password change
- Delete account

### 10. Subscription & Billing
**Pricing Tiers:**

**Free Tier:**
- GPT-4o mini only
- Limited messages per day
- Basic features
- Standard support

**Pro Plan ($19.99/month or $199/year):**
- All AI models (GPT-4o, Claude Sonnet 4, Gemini 2.5)
- Unlimited messages
- Image generation (DALL-E 3)
- Priority support
- Advanced features
- No ads

**Ultra Pro Plan ($49.99/month or $499/year):**
- All Pro features
- GPT-5 access
- Grok 4 access
- DeepSeek V3.2 access
- Highest priority
- Early access to new features
- Dedicated support

**Implementation:**
- StoreKit 2 for in-app purchases
- Stripe webhook integration for web purchases
- Subscription status checking
- Restore purchases functionality
- Subscription management (upgrade, downgrade, cancel)
- Trial period support

### 11. Real-time Updates
**Supabase Realtime Integration:**
- Subscribe to conversation updates
- Live message arrival
- Typing indicators (if implemented)
- Conversation list updates
- Usage limit updates

**WebSocket Connection:**
```swift
// Subscribe to messages in current conversation
supabase
    .channel("messages:\(conversationId)")
    .on("INSERT", filter: "conversation_id=eq.\(conversationId)") { message in
        // Append new message to chat
    }
    .subscribe()
```

### 12. Offline Support & Caching
**Local Storage:**
- Cache recent conversations
- Store message history locally
- Offline message composition (queue for sending)
- Sync when connection restored
- Image caching

**CoreData Schema:**
```
Entities:
- CachedConversation
- CachedMessage
- CachedProject
- UserSettings
```

---

## Database Schema (Supabase PostgreSQL)

### Tables

**profiles**
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users NOT NULL,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    signup_method TEXT, -- 'email' or 'google'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**conversations**
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    project_id UUID REFERENCES projects,
    title TEXT,
    model TEXT DEFAULT 'gpt-4o-mini',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**messages**
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations NOT NULL,
    user_id UUID REFERENCES auth.users NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    image_url TEXT,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    model TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**projects**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**subscriptions**
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT, -- 'free', 'pro', 'ultra_pro'
    status TEXT, -- 'active', 'canceled', 'past_due'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**token_usage**
```sql
CREATE TABLE token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    conversation_id UUID REFERENCES conversations,
    message_id UUID REFERENCES messages,
    model TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    cost DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**image_generations**
```sql
CREATE TABLE image_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    conversation_id UUID REFERENCES conversations,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    revised_prompt TEXT,
    size TEXT DEFAULT '1024x1024',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## iOS App Architecture

### Project Structure
```
AdamAIChat/
├── AdamAIChatApp.swift           // Main app entry point
├── Models/
│   ├── User.swift
│   ├── Conversation.swift
│   ├── Message.swift
│   ├── Project.swift
│   ├── Subscription.swift
│   └── ImageGeneration.swift
├── ViewModels/
│   ├── AuthViewModel.swift
│   ├── ChatViewModel.swift
│   ├── ConversationViewModel.swift
│   ├── ProjectViewModel.swift
│   ├── ImageGenerationViewModel.swift
│   ├── SettingsViewModel.swift
│   └── SubscriptionViewModel.swift
├── Views/
│   ├── Authentication/
│   │   ├── LoginView.swift
│   │   ├── SignUpView.swift
│   │   ├── ForgotPasswordView.swift
│   │   └── AuthModalView.swift
│   ├── Chat/
│   │   ├── ChatView.swift
│   │   ├── MessageBubbleView.swift
│   │   ├── MessageInputView.swift
│   │   ├── ModelSelectorView.swift
│   │   ├── TypingIndicatorView.swift
│   │   └── CodeBlockView.swift
│   ├── Sidebar/
│   │   ├── SidebarView.swift
│   │   ├── ConversationListView.swift
│   │   └── ConversationRowView.swift
│   ├── ImageGeneration/
│   │   ├── ImageGenerationView.swift
│   │   ├── GeneratedImageView.swift
│   │   └── ImagePromptInputView.swift
│   ├── Projects/
│   │   ├── ProjectListView.swift
│   │   ├── ProjectDetailView.swift
│   │   └── ProjectFormView.swift
│   ├── Settings/
│   │   ├── SettingsView.swift
│   │   ├── ThemeSettingsView.swift
│   │   ├── AccountSettingsView.swift
│   │   └── SubscriptionSettingsView.swift
│   ├── Subscription/
│   │   ├── PricingView.swift
│   │   ├── SubscriptionPlansView.swift
│   │   └── PaywallView.swift
│   └── Components/
│       ├── LoadingView.swift
│       ├── ErrorView.swift
│       ├── EmptyStateView.swift
│       └── ToastView.swift
├── Services/
│   ├── SupabaseService.swift      // Supabase client wrapper
│   ├── AuthService.swift          // Authentication logic
│   ├── ChatService.swift          // Chat API calls
│   ├── ImageService.swift         // Image operations
│   ├── AudioService.swift         // Voice recording/playback
│   ├── FileService.swift          // File upload/download
│   ├── StorageService.swift       // Local storage/cache
│   └── SubscriptionService.swift  // IAP and subscription
├── Utilities/
│   ├── Constants.swift
│   ├── Extensions/
│   │   ├── View+Extensions.swift
│   │   ├── Color+Extensions.swift
│   │   └── String+Extensions.swift
│   ├── Markdown/
│   │   └── MarkdownRenderer.swift
│   └── Helpers/
│       ├── KeychainHelper.swift
│       ├── NetworkMonitor.swift
│       └── DateFormatter+Custom.swift
├── Resources/
│   ├── Assets.xcassets
│   ├── Fonts/
│   └── Localizable.strings
└── CoreData/
    └── AdamAIChat.xcdatamodeld
```

### Key ViewModels

**AuthViewModel.swift**
```swift
@MainActor
class AuthViewModel: ObservableObject {
    @Published var user: User?
    @Published var session: Session?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func signIn(email: String, password: String) async
    func signUp(email: String, password: String, displayName: String) async
    func signInWithGoogle() async
    func signOut() async
    func resetPassword(email: String) async
    func updateProfile(displayName: String?, avatarUrl: String?) async
    func deleteAccount() async
}
```

**ChatViewModel.swift**
```swift
@MainActor
class ChatViewModel: ObservableObject {
    @Published var conversations: [Conversation] = []
    @Published var currentConversation: Conversation?
    @Published var messages: [Message] = []
    @Published var inputText = ""
    @Published var selectedModel = "gpt-4o-mini"
    @Published var isGenerating = false
    @Published var attachedImages: [UIImage] = []
    @Published var attachedFiles: [URL] = []
    
    private var realtimeChannel: RealtimeChannel?
    
    func createConversation(title: String?, projectId: UUID?) async
    func loadConversations() async
    func loadMessages(conversationId: UUID) async
    func sendMessage() async
    func regenerateLastMessage() async
    func deleteMessage(messageId: UUID) async
    func deleteConversation(conversationId: UUID) async
    func subscribeToMessages(conversationId: UUID)
    func unsubscribeFromMessages()
}
```

**ImageGenerationViewModel.swift**
```swift
@MainActor
class ImageGenerationViewModel: ObservableObject {
    @Published var prompt = ""
    @Published var generatedImage: UIImage?
    @Published var isGenerating = false
    @Published var imageHistory: [ImageGeneration] = []
    
    func generateImage(prompt: String) async
    func saveImage(image: UIImage) async
    func loadHistory() async
}
```

---

## API Integration Details

### Supabase Edge Functions

All API calls should go through Supabase Edge Functions. Base URL:
```
https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1
```

**Authentication Header:**
```swift
headers = [
    "Authorization": "Bearer \(userAccessToken)",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
]
```

### 1. Chat API (chat-with-ai-optimized)

**Endpoint:** POST /functions/v1/chat-with-ai-optimized

**Request Body:**
```json
{
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "user", "content": "How are you?"}
  ],
  "model": "gpt-4o-mini",
  "stream": false,
  "conversationId": "uuid-here",
  "imageUrl": "https://...", // optional
  "fileContent": "text content", // optional
  "fileName": "document.pdf", // optional
  "fileType": "application/pdf" // optional
}
```

**Response:**
```json
{
  "response": "AI generated response text",
  "messageId": "uuid",
  "tokensUsed": 1234,
  "model": "gpt-4o-mini"
}
```

**Streaming Response:**
If `stream: true`, use Server-Sent Events (SSE):
```
data: {"type": "content", "content": "Hello"}
data: {"type": "content", "content": " there"}
data: {"type": "done", "messageId": "uuid", "tokensUsed": 100}
```

### 2. Image Generation API

**Endpoint:** POST /functions/v1/generate-image

**Request Body:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x1024",
  "conversationId": "uuid-here" // optional
}
```

**Response:**
```json
{
  "imageUrl": "https://storage.supabase.co/...",
  "revisedPrompt": "Enhanced prompt used",
  "generationId": "uuid"
}
```

### 3. Image Analysis API

**Endpoint:** POST /functions/v1/analyze-image

**Request Body:**
```json
{
  "imageUrl": "https://...",
  "prompt": "What's in this image?",
  "conversationId": "uuid-here"
}
```

**Response:**
```json
{
  "analysis": "Detailed description...",
  "messageId": "uuid"
}
```

### 4. Speech-to-Text API

**Endpoint:** POST /functions/v1/speech-to-text

**Request Body:**
```json
{
  "audioData": "base64-encoded-audio",
  "format": "m4a"
}
```

**Response:**
```json
{
  "transcription": "Transcribed text here"
}
```

### 5. Text-to-Speech API

**Endpoint:** POST /functions/v1/text-to-speech

**Request Body:**
```json
{
  "text": "Text to convert to speech",
  "voice": "alloy",
  "speed": 1.0
}
```

**Response:**
```json
{
  "audioUrl": "https://storage.supabase.co/..."
}
```

---

## UI/UX Design Guidelines

### Design System

**Color Palette (HSL-based):**
```swift
// Light Mode
struct LightTheme {
    static let background = Color(hsl: 0, 0%, 100%)
    static let foreground = Color(hsl: 222.2, 84%, 4.9%)
    static let primary = Color(hsl: 222.2, 47.4%, 11.2%)
    static let primaryForeground = Color(hsl: 210, 40%, 98%)
    static let secondary = Color(hsl: 210, 40%, 96.1%)
    static let secondaryForeground = Color(hsl: 222.2, 47.4%, 11.2%)
    static let accent = Color(hsl: 210, 40%, 96.1%)
    static let accentForeground = Color(hsl: 222.2, 47.4%, 11.2%)
    static let muted = Color(hsl: 210, 40%, 96.1%)
    static let mutedForeground = Color(hsl: 215.4, 16.3%, 46.9%)
    static let border = Color(hsl: 214.3, 31.8%, 91.4%)
    static let input = Color(hsl: 214.3, 31.8%, 91.4%)
    static let ring = Color(hsl: 222.2, 84%, 4.9%)
}

// Dark Mode
struct DarkTheme {
    static let background = Color(hsl: 222.2, 84%, 4.9%)
    static let foreground = Color(hsl: 210, 40%, 98%)
    static let primary = Color(hsl: 210, 40%, 98%)
    static let primaryForeground = Color(hsl: 222.2, 47.4%, 11.2%)
    static let secondary = Color(hsl: 217.2, 32.6%, 17.5%)
    static let secondaryForeground = Color(hsl: 210, 40%, 98%)
    static let accent = Color(hsl: 217.2, 32.6%, 17.5%)
    static let accentForeground = Color(hsl: 210, 40%, 98%)
    static let muted = Color(hsl: 217.2, 32.6%, 17.5%)
    static let mutedForeground = Color(hsl: 215, 20.2%, 65.1%)
    static let border = Color(hsl: 217.2, 32.6%, 17.5%)
    static let input = Color(hsl: 217.2, 32.6%, 17.5%)
    static let ring = Color(hsl: 212.7, 26.8%, 83.9%)
}
```

**Typography:**
- Headlines: SF Pro Display, Bold, 28-34pt
- Body: SF Pro Text, Regular, 16pt
- Caption: SF Pro Text, Regular, 14pt
- Code: SF Mono, Regular, 14pt

**Spacing:**
- Extra Small: 4pt
- Small: 8pt
- Medium: 16pt
- Large: 24pt
- Extra Large: 32pt

**Corner Radius:**
- Small: 8pt
- Medium: 12pt
- Large: 16pt

**Animations:**
- Standard duration: 0.3s
- Easing: ease-in-out
- Use spring animations for interactive elements

### Key UI Components

**Message Bubble:**
```swift
struct MessageBubbleView: View {
    let message: Message
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if message.role == .assistant {
                // AI avatar
                Circle()
                    .fill(Color.primary)
                    .frame(width: 32, height: 32)
                    .overlay {
                        Image(systemName: "sparkles")
                            .foregroundColor(.white)
                    }
            }
            
            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                // Message content with markdown
                MarkdownText(message.content)
                    .padding(12)
                    .background(message.role == .user ? Color.primary : Color.secondary)
                    .foregroundColor(message.role == .user ? .white : .primary)
                    .cornerRadius(12)
                
                // Timestamp and actions
                HStack(spacing: 8) {
                    Text(message.createdAt, style: .time)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if message.role == .assistant {
                        Button(action: copyMessage) {
                            Image(systemName: "doc.on.doc")
                        }
                        
                        Button(action: regenerate) {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                }
            }
            
            if message.role == .user {
                // User avatar
                AsyncImage(url: userAvatarURL) { image in
                    image.resizable()
                } placeholder: {
                    Circle().fill(Color.gray)
                }
                .frame(width: 32, height: 32)
                .clipShape(Circle())
            }
        }
        .padding(.horizontal)
    }
}
```

**Typing Indicator:**
```swift
struct TypingIndicatorView: View {
    @State private var animationOffset: CGFloat = 0
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.primary)
                    .frame(width: 8, height: 8)
                    .offset(y: animationOffset)
                    .animation(
                        Animation.easeInOut(duration: 0.6)
                            .repeatForever()
                            .delay(Double(index) * 0.15),
                        value: animationOffset
                    )
            }
        }
        .padding(12)
        .background(Color.secondary)
        .cornerRadius(12)
        .onAppear {
            animationOffset = -8
        }
    }
}
```

**Model Selector:**
```swift
struct ModelSelectorView: View {
    @Binding var selectedModel: String
    let models: [AIModel]
    let userSubscription: SubscriptionTier
    
    var body: some View {
        Menu {
            ForEach(models) { model in
                Button {
                    if model.tier == .free || userSubscription != .free {
                        selectedModel = model.id
                    }
                } label: {
                    HStack {
                        Image(model.iconName)
                            .resizable()
                            .frame(width: 20, height: 20)
                        
                        VStack(alignment: .leading) {
                            Text(model.name)
                                .font(.body)
                            Text(model.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        if model.tier != .free {
                            Image(systemName: "crown.fill")
                                .foregroundColor(.yellow)
                        }
                    }
                }
                .disabled(model.tier != .free && userSubscription == .free)
            }
        } label: {
            HStack {
                if let model = models.first(where: { $0.id == selectedModel }) {
                    Image(model.iconName)
                        .resizable()
                        .frame(width: 24, height: 24)
                    Text(model.shortLabel)
                }
                Image(systemName: "chevron.down")
            }
            .padding(8)
            .background(Color.secondary)
            .cornerRadius(8)
        }
    }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Xcode project with SwiftUI
- [ ] Install Supabase Swift SDK via SPM
- [ ] Configure app bundle ID and capabilities
- [ ] Set up CoreData schema
- [ ] Implement design system (colors, typography, spacing)
- [ ] Create base ViewModels
- [ ] Set up keychain helper for secure storage
- [ ] Implement network monitoring

### Phase 2: Authentication (Week 2-3)
- [ ] Build AuthViewModel
- [ ] Create login/signup views
- [ ] Implement email/password authentication
- [ ] Add Google Sign-In (OAuth)
- [ ] Create password reset flow
- [ ] Add session persistence
- [ ] Implement profile management
- [ ] Test authentication flows

### Phase 3: Chat Interface (Week 3-5)
- [ ] Build ChatViewModel
- [ ] Create chat view layout
- [ ] Implement message list with ScrollView
- [ ] Build message bubble components
- [ ] Add markdown rendering
- [ ] Implement code block with syntax highlighting
- [ ] Create message input view
- [ ] Add model selector
- [ ] Implement typing indicator
- [ ] Add send message functionality
- [ ] Integrate chat API
- [ ] Add real-time message updates

### Phase 4: Conversation Management (Week 5-6)
- [ ] Build ConversationViewModel
- [ ] Create sidebar view
- [ ] Implement conversation list
- [ ] Add conversation grouping (Today, Yesterday, etc.)
- [ ] Create new conversation flow
- [ ] Add conversation deletion
- [ ] Implement conversation search
- [ ] Add conversation title editing

### Phase 5: Image Features (Week 6-7)
- [ ] Build ImageGenerationViewModel
- [ ] Create image generation view
- [ ] Implement DALL-E 3 integration
- [ ] Add image upload (photo library + camera)
- [ ] Implement image analysis
- [ ] Create image attachment in chat
- [ ] Add image viewer/zoom
- [ ] Implement image saving and sharing

### Phase 6: Voice Features (Week 7-8)
- [ ] Build AudioService
- [ ] Implement speech-to-text
- [ ] Add voice recording UI
- [ ] Create audio visualization
- [ ] Implement text-to-speech
- [ ] Add audio playback controls
- [ ] Handle audio permissions

### Phase 7: File Management (Week 8-9)
- [ ] Build FileService
- [ ] Add file picker integration
- [ ] Implement file upload to Supabase Storage
- [ ] Create file preview components
- [ ] Add PDF parsing
- [ ] Implement document analysis
- [ ] Create file attachment UI in chat

### Phase 8: Projects (Week 9-10)
- [ ] Build ProjectViewModel
- [ ] Create project list view
- [ ] Implement project creation/editing
- [ ] Add project-conversation association
- [ ] Build project detail view
- [ ] Add project deletion

### Phase 9: Settings & Preferences (Week 10-11)
- [ ] Build SettingsViewModel
- [ ] Create settings view
- [ ] Implement theme switching
- [ ] Add accent color picker
- [ ] Create account settings
- [ ] Add notification preferences
- [ ] Implement data export/import

### Phase 10: Subscription & IAP (Week 11-13)
- [ ] Build SubscriptionService
- [ ] Set up StoreKit 2
- [ ] Create pricing view
- [ ] Implement subscription plans UI
- [ ] Add in-app purchase flow
- [ ] Integrate Stripe webhooks
- [ ] Implement subscription status checking
- [ ] Add restore purchases
- [ ] Create paywall for pro features
- [ ] Add usage limit tracking
- [ ] Implement upgrade prompts

### Phase 11: Offline & Caching (Week 13-14)
- [ ] Implement CoreData persistence
- [ ] Add offline message caching
- [ ] Create sync mechanism
- [ ] Implement image caching
- [ ] Add queue for offline operations
- [ ] Handle network reconnection

### Phase 12: Polish & Testing (Week 14-16)
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Create empty states
- [ ] Add haptic feedback
- [ ] Optimize performance
- [ ] Test on different devices
- [ ] Fix accessibility issues
- [ ] Add analytics
- [ ] Implement crash reporting
- [ ] Test all user flows
- [ ] Bug fixes and refinements

### Phase 13: Deployment (Week 16)
- [ ] Prepare app screenshots
- [ ] Write app store description
- [ ] Set up App Store Connect
- [ ] Submit for TestFlight
- [ ] Beta testing
- [ ] Address feedback
- [ ] Submit for App Store review
- [ ] Launch! 🚀

---

## Critical Technical Considerations

### 1. Supabase Swift SDK Integration

**Installation (SPM):**
```swift
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift.git", from: "2.0.0")
]
```

**Initialize Client:**
```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://lciaiunzacgvvbvcshdh.supabase.co")!,
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
)
```

### 2. Authentication with Supabase

**Email/Password Sign In:**
```swift
let session = try await supabase.auth.signIn(
    email: email,
    password: password
)
```

**Google OAuth:**
```swift
try await supabase.auth.signInWithOAuth(
    provider: .google,
    redirectTo: URL(string: "adamaichat://auth-callback")
)
```

**URL Scheme Setup:**
Add to Info.plist:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>adamaichat</string>
        </array>
    </dict>
</array>
```

### 3. Real-time Subscriptions

**Subscribe to Messages:**
```swift
let channel = await supabase.channel("messages:\(conversationId)")

await channel.on(
    .postgresChanges(
        event: .insert,
        schema: "public",
        table: "messages",
        filter: "conversation_id=eq.\(conversationId)"
    )
) { payload in
    if let newMessage = try? JSONDecoder().decode(Message.self, from: payload) {
        messages.append(newMessage)
    }
}

await channel.subscribe()
```

### 4. File Upload to Storage

**Upload Image:**
```swift
let imageData = image.jpegData(compressionQuality: 0.8)!
let fileName = "\(userId)/\(UUID().uuidString).jpg"

try await supabase.storage
    .from("images")
    .upload(
        path: fileName,
        file: imageData,
        options: .init(contentType: "image/jpeg")
    )

let publicURL = try supabase.storage
    .from("images")
    .getPublicURL(path: fileName)
```

### 5. Streaming Responses

**SSE Implementation:**
```swift
func streamChat(messages: [Message]) async throws -> AsyncThrowingStream<String, Error> {
    let url = URL(string: "\(supabaseURL)/functions/v1/chat-with-ai-optimized")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: Any] = [
        "messages": messages.map { ["role": $0.role, "content": $0.content] },
        "stream": true,
        "model": selectedModel
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    let (bytes, _) = try await URLSession.shared.bytes(for: request)
    
    return AsyncThrowingStream { continuation in
        Task {
            for try await line in bytes.lines {
                if line.hasPrefix("data: ") {
                    let jsonString = String(line.dropFirst(6))
                    if let data = jsonString.data(using: .utf8),
                       let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let content = json["content"] as? String {
                        continuation.yield(content)
                    }
                }
            }
            continuation.finish()
        }
    }
}
```

### 6. Markdown Rendering

Use a Swift package like `MarkdownUI`:
```swift
import MarkdownUI

Markdown(message.content)
    .markdownTheme(.gitHub)
    .markdownCodeSyntaxHighlighter(.splash(theme: .sunset))
```

### 7. Image Compression

```swift
extension UIImage {
    func compressForUpload(maxSizeMB: Double = 5.0) -> Data? {
        let maxBytes = maxSizeMB * 1024 * 1024
        var compression: CGFloat = 1.0
        var imageData = self.jpegData(compressionQuality: compression)
        
        while let data = imageData, Double(data.count) > maxBytes && compression > 0.1 {
            compression -= 0.1
            imageData = self.jpegData(compressionQuality: compression)
        }
        
        return imageData
    }
}
```

### 8. Keychain Storage

```swift
class KeychainHelper {
    static func save(key: String, data: Data) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)
        return SecItemAdd(query as CFDictionary, nil) == noErr
    }
    
    static func load(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        return result as? Data
    }
}
```

---

## Testing Requirements

### Unit Tests
- [ ] AuthViewModel tests
- [ ] ChatViewModel tests
- [ ] Message parsing tests
- [ ] Markdown rendering tests
- [ ] Date formatting tests
- [ ] Keychain helper tests

### Integration Tests
- [ ] Supabase authentication flow
- [ ] Message sending/receiving
- [ ] Real-time subscription
- [ ] File upload/download
- [ ] Image generation
- [ ] Subscription validation

### UI Tests
- [ ] Login/signup flow
- [ ] Chat interface interactions
- [ ] Message sending
- [ ] Model switching
- [ ] Image attachment
- [ ] Settings changes
- [ ] Subscription upgrade

### Performance Tests
- [ ] Message list scrolling (1000+ messages)
- [ ] Image loading performance
- [ ] Real-time update latency
- [ ] Memory usage
- [ ] Battery consumption

---

## Security Considerations

1. **API Keys**: Never hardcode API keys. Use environment variables or secure config files.
2. **Token Storage**: Store auth tokens in Keychain, never UserDefaults.
3. **HTTPS Only**: All network requests must use HTTPS.
4. **Input Validation**: Sanitize all user inputs before sending to APIs.
5. **Biometric Auth**: Optionally add Face ID/Touch ID for app lock.
6. **Certificate Pinning**: Consider implementing for production.
7. **Jailbreak Detection**: Add basic detection for compromised devices.

---

## Accessibility Requirements

- [ ] VoiceOver support for all UI elements
- [ ] Dynamic Type support for text scaling
- [ ] High contrast mode support
- [ ] Reduced motion support (disable animations)
- [ ] Keyboard navigation support (iPad)
- [ ] Color blind friendly color palette
- [ ] Screen reader-friendly labels

---

## App Store Requirements

### Metadata
- **App Name:** Adam AI Chat
- **Subtitle:** AI Assistant with Multi-Model Support
- **Keywords:** AI, ChatGPT, Claude, Gemini, Chat, Assistant, Image Generation
- **Category:** Productivity
- **Age Rating:** 4+

### Privacy Policy
- Data collection: Email, usage analytics
- Third-party APIs: OpenAI, Anthropic, Google, Supabase
- No data sale or sharing with third parties
- User can delete account and all data

### App Store Screenshots
- iPhone 15 Pro Max (6.7")
- iPhone 15 (6.1")
- iPad Pro 12.9"
- Highlight features: Multi-model chat, Image generation, Voice input, Projects

---

## Additional Resources

### Assets Needed
- App icon (1024x1024)
- Launch screen
- Model logos: OpenAI, Claude, Gemini, DeepSeek, Grok
- Empty state illustrations
- Error state illustrations
- Onboarding graphics

### Documentation
- User guide
- FAQ
- API documentation
- Privacy policy
- Terms of service

---

## Success Metrics

### KPIs to Track
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Messages sent per user
- Subscription conversion rate
- Churn rate
- Average session duration
- Feature adoption rates
- App Store rating
- Crash-free rate (target: >99.5%)

---

## Post-Launch Roadmap

### Version 1.1 (Q2)
- iPad optimization with split view
- Widgets for quick access
- Siri shortcuts integration
- Share extension
- Today extension

### Version 1.2 (Q3)
- Apple Watch companion app
- Handoff support between devices
- iCloud sync for cross-device conversations
- Custom AI instructions
- Conversation folders

### Version 1.3 (Q4)
- Collaborative projects (share with other users)
- Team subscriptions
- Advanced analytics
- Custom AI training on user data
- API access for developers

---

## Development Guidelines

### Code Style
- Follow Swift API Design Guidelines
- Use SwiftLint for consistency
- Write comprehensive documentation comments
- Use meaningful variable/function names
- Keep functions small and focused (max 50 lines)
- Use dependency injection for testability

### Git Workflow
- Main branch: production-ready code
- Develop branch: integration branch
- Feature branches: feature/feature-name
- Commit messages: Use conventional commits
- Pull requests required for all changes
- Code review mandatory

### Error Handling
- Use Result types for async operations
- Provide user-friendly error messages
- Log errors for debugging
- Graceful degradation
- Retry logic for network failures

### Performance
- Lazy loading for lists
- Image caching
- Database indexing
- Minimize main thread work
- Use background queues for heavy operations
- Profile regularly with Instruments

---

## Contact & Support

### Development Team
- **Lead Developer:** [Your Name]
- **UI/UX Designer:** [Designer Name]
- **Backend Engineer:** [Backend Dev Name]

### Support Channels
- Email: support@adamaichat.com
- In-app support chat
- FAQ/Help Center
- Twitter: @adamaichat

---

## Final Notes

This iOS app should be a pixel-perfect, feature-complete native implementation of the web application. Pay special attention to:

1. **Performance:** The app must be fast and responsive. No janky scrolling.
2. **Design:** Follow iOS Human Interface Guidelines strictly.
3. **Reliability:** Implement robust error handling and offline support.
4. **Security:** Protect user data at all costs.
5. **Accessibility:** Make the app usable by everyone.
6. **Testing:** Test thoroughly on various devices and iOS versions.

The web app has been optimized for speed with recent changes reducing message display latency. Ensure the iOS app matches or exceeds this performance.

**Good luck with the development! 🚀**

---

## Appendix A: Model Information

### GPT-4o mini
- Provider: OpenAI
- Speed: Fast
- Cost: Low
- Best for: General tasks, quick responses
- Token limit: 128K

### GPT-4o
- Provider: OpenAI
- Speed: Medium
- Cost: Medium
- Best for: Complex reasoning, analysis
- Token limit: 128K

### GPT-5
- Provider: OpenAI
- Speed: Medium-Slow
- Cost: High
- Best for: Most advanced tasks, best quality
- Token limit: 256K

### Claude Sonnet 4
- Provider: Anthropic
- Speed: Medium
- Cost: Medium
- Best for: Writing, creative tasks
- Token limit: 200K

### Gemini 2.5 Flash
- Provider: Google
- Speed: Very Fast
- Cost: Low
- Best for: Quick responses, real-time
- Token limit: 1M

### DeepSeek V3.2
- Provider: DeepSeek
- Speed: Medium
- Cost: Low
- Best for: Reasoning, math, code
- Token limit: 64K

### Grok 4
- Provider: xAI
- Speed: Medium
- Cost: Medium
- Best for: Real-time info, humor
- Token limit: 128K

---

## Appendix B: Sample Code Snippets

### Main App Entry
```swift
@main
struct AdamAIChatApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    @StateObject private var chatViewModel = ChatViewModel()
    @StateObject private var themeManager = ThemeManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
                .environmentObject(chatViewModel)
                .environmentObject(themeManager)
                .preferredColorScheme(themeManager.colorScheme)
                .onOpenURL { url in
                    // Handle OAuth callback
                    if url.scheme == "adamaichat" {
                        authViewModel.handleAuthCallback(url: url)
                    }
                }
        }
    }
}
```

### Content View
```swift
struct ContentView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        Group {
            if authViewModel.isLoading {
                LoadingView()
            } else if authViewModel.isAuthenticated {
                MainTabView()
            } else {
                AuthModalView()
            }
        }
    }
}
```

### Main Tab View
```swift
struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationView {
            HStack(spacing: 0) {
                SidebarView(selectedConversation: $selectedConversation)
                    .frame(width: 280)
                
                Divider()
                
                ChatView(conversation: selectedConversation)
            }
        }
    }
}
```

---

**END OF PROMPT**

This comprehensive prompt should provide Cursor AI with all the necessary information to build a fully-functional iOS version of your Adam AI Chat application. The prompt covers architecture, features, APIs, UI/UX, implementation phases, and technical details needed for a successful iOS app development.
