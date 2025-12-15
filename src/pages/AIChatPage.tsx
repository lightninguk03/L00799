import ChatWidget from '../components/ai/ChatWidget';

const AIChatPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] text-center p-6 relative">
            {/* 
              既然是专属 AI 页面，直接在这里渲染 ChatWidget 
              ChatWidget 内部默认可能是 fixed 定位，我们需要覆盖它的样式或者使其适应页面布局 
              或者简单地：在这个页面，让 ChatWidget 强制显示且居中（如果支持的话）
            */}
            {/* 临时方案：在这个页面直接挂载 ChatWidget，并尝试传递 clear positioning props (如果 Component 支持) 
               如果 ChatWidget 是纯悬浮的且硬编码了 fixed bottom-4，我们需要去改为支持 embedded 模式 
            */}
            <ChatWidget forceOpen={true} embedded={true} />
        </div>
    );
};

export default AIChatPage;
