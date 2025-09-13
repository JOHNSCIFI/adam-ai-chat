import React from 'react';
import { ModernChatInterface } from '@/components/ModernChatInterface';

export default function Chat() {
  return <ModernChatInterface />;
}
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({children}) => <h1 className="text-xl font-bold mb-4 text-foreground">{children}</h1>,
                                h2: ({children}) => <h2 className="text-lg font-semibold mb-3 text-foreground">{children}</h2>,
                                h3: ({children}) => <h3 className="text-base font-medium mb-2 text-foreground">{children}</h3>,
                                p: ({children}) => <p className="mb-3 text-sm leading-relaxed text-foreground">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                                em: ({children}) => <em className="italic text-foreground">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="text-sm text-foreground">{children}</li>,
                                code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>,
                                pre: ({children}) => <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm">{children}</pre>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3">{children}</blockquote>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      
                      {/* Copy button - better positioning for mobile */}
                      {hoveredMessage === message.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`absolute ${message.role === 'user' ? 'left-0' : 'right-0'} top-0 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md min-h-[32px] min-w-[32px]`}
                          onClick={() => copyToClipboard(message.content, message.id)}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - responsive design */}
      <div className="border-t border-border bg-background/95 backdrop-blur-sm p-safe">
        <div className="max-w-4xl mx-auto w-full p-4 sm:p-6">
          <form onSubmit={sendMessage} className="space-y-4">
            {/* File attachments preview */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg animate-fade-in">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background rounded-md p-2 border">
                    {getFileIcon(file.type)}
                    <span className="text-sm truncate max-w-[120px] sm:max-w-[200px]">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Message input container with ChatGPT styling */}
            <div className="flex items-end gap-2 sm:gap-3 p-3 rounded-2xl border border-border bg-muted/50 shadow-sm focus-within:shadow-md transition-all duration-200">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-accent rounded-full flex-shrink-0"
                    disabled={loading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-64 p-3 bg-popover border shadow-lg z-50">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Attach files</p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-accent rounded-lg"
                      onClick={handleFileUpload}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Choose files</div>
                        <div className="text-xs text-muted-foreground">Images, documents, videos</div>
                      </div>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border-0 bg-transparent placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-base resize-none min-h-0 h-auto py-2"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e as any);
                  }
                }}
              />
              
              <Button 
                type="submit" 
                disabled={(!input.trim() && selectedFiles.length === 0) || loading}
                size="sm"
                className={`rounded-full h-8 w-8 p-0 flex-shrink-0 transition-all duration-200 min-h-[32px] min-w-[32px] ${
                  (input.trim() || selectedFiles.length > 0) && !loading 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 shadow-sm' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="animate-pulse-subtle">
                    <div className="w-4 h-4 rounded-full bg-current" />
                  </div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.ppt,.pptx,.xls,.xlsx"
            />
            
            <p className="text-xs text-muted-foreground text-center px-4">
              adamGPT can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}