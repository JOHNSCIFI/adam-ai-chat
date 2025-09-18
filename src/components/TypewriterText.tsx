import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterTextProps {
  text: string;
  typeSpeed?: number;
  backSpeed?: number;
  onComplete?: () => void;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  typeSpeed = 50,
  backSpeed = 30,
  onComplete,
  className = ''
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!text) return;

    const timer = setTimeout(() => {
      if (isTyping) {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        } else {
          setIsTyping(false);
          onComplete?.();
        }
      }
    }, typeSpeed);

    return () => clearTimeout(timer);
  }, [currentIndex, isTyping, text, typeSpeed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
    setIsTyping(true);
  }, [text]);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match;
            return inline ? (
              <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm break-words" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto break-words !my-1">
                <code {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          p: ({children, ...props}) => (
            <p {...props} className="break-words overflow-wrap-anywhere !my-0" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>
              {children}
            </p>
          ),
          h1: ({children, ...props}) => (
            <h1 {...props} className="!my-1 !mb-1">
              {children}
            </h1>
          ),
          h2: ({children, ...props}) => (
            <h2 {...props} className="!my-1 !mb-1">
              {children}
            </h2>
          ),
          h3: ({children, ...props}) => (
            <h3 {...props} className="!my-0.5 !mb-0.5">
              {children}
            </h3>
          ),
          h4: ({children, ...props}) => (
            <h4 {...props} className="!my-0.5 !mb-0.5">
              {children}
            </h4>
          ),
          ul: ({children, ...props}) => (
            <ul {...props} className="!my-0 !leading-tight [&>li]:!my-0">
              {children}
            </ul>
          ),
          ol: ({children, ...props}) => (
            <ol {...props} className="!my-0 !leading-tight [&>li]:!my-0">
              {children}
            </ol>
          ),
          li: ({children, ...props}) => (
            <li {...props} className="!my-0">
              {children}
            </li>
          ),
          blockquote: ({children, ...props}) => (
            <blockquote {...props} className="!my-1">
              {children}
            </blockquote>
          ),
          table: ({children, ...props}) => (
            <table {...props} className="!my-1">
              {children}
            </table>
          ),
          hr: ({...props}) => (
            <hr {...props} className="!my-1" />
          ),
        }}
      >
        {displayText}
      </ReactMarkdown>
      {isTyping && <span className="animate-pulse ml-1">|</span>}
    </div>
  );
};