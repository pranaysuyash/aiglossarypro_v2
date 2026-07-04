import { MessageResponse, type MessageResponseProps } from "@/components/ai-elements/message";

type StudyRichTextProps = Omit<MessageResponseProps, "children"> & {
  children: string;
  variant?: "default" | "compact";
};

export function StudyRichText({ children, className, variant = "default", ...props }: StudyRichTextProps) {
  return (
    <MessageResponse
      className={`study-rich-text study-rich-text-${variant}${className ? ` ${className}` : ""}`}
      parseIncompleteMarkdown={true}
      {...props}
    >
      {children}
    </MessageResponse>
  );
}
