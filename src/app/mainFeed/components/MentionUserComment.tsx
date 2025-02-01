import {
    Avatar,
    Box,
    List,
    ListItem,
    Spinner,
    Text,
    Textarea,
} from "@chakra-ui/react";
import { Client } from "@hiveio/dhive";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface MentionCommentProps {
    onCommentChange?: (comment: string) => void;
    onCommentSubmit?: React.Dispatch<React.SetStateAction<string>>;
    placeholder?: string;
    isLoading?: boolean;
    onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
    textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    ref?: React.RefObject<HTMLTextAreaElement>;
}

const MentionComment: React.FC<MentionCommentProps> = ({
    onCommentChange,
    onCommentSubmit,
    placeholder,
    ref,
    isLoading,
    onPaste,
    textareaProps = {},
}) => {
    const [comment, setComment] = useState("");
    const [authors, setAuthors] = useState<string[]>([]);
    const [isListVisible, setIsListVisible] = useState(false);
    const [mentionIndex, setMentionIndex] = useState<number | null>(null);
    const client = useRef(new Client(["https://api.hive.blog"]));
    const cacheRef = useRef<{ [key: string]: string[] }>({});
    const [localIsLoading, setLocalIsLoading] = useState(false);

    const fetchAuthors = async (query: string) => {
        if (!query) return;
        if (cacheRef.current[query]) {
            setAuthors(cacheRef.current[query]);
            return;
        }
        setLocalIsLoading(true);
        try {
            const sanitizedQuery = query.startsWith("@") ? query.slice(1) : query;
            const result = await client.current.database.call("lookup_accounts", [
                sanitizedQuery,
                5,
            ]);
            cacheRef.current[query] = result;
            setAuthors(result);
        } catch (error) {
            console.error("Error fetching authors:", error);
        } finally {
            setLocalIsLoading(false);
        }
    };

    const debouncedFetchAuthors = useCallback(
        debounce((search: string) => {
            fetchAuthors(search);
        }, 500),
        []
    );

    useEffect(() => {
        const match = comment.match(/@(\\w+)$/);
        if (match) {
            setMentionIndex(match.index || null);
            debouncedFetchAuthors(match[1]);
            setIsListVisible(true);
        } else {
            setAuthors([]);
            setIsListVisible(false);
        }
    }, [comment, debouncedFetchAuthors]);

    const handleSelectUser = (username: string) => {
        if (mentionIndex !== null) {
            const newComment =
                comment.substring(0, mentionIndex) +
                `@${username} ` +
                comment.substring(mentionIndex + username.length + 1);
            setComment(newComment);
            setIsListVisible(false);
            onCommentChange?.(newComment);
        }
    };

    const renderHighlightedText = (text: string) => {
        return text.split(/(@\w+)/g).map((part, index) =>
            part.startsWith("@") ? (
                <Text as="span" key={index} color="green.400" fontWeight="bold">
                    {part}
                </Text>
            ) : (
                part
            )
        );
    };

    return (
        <>
            <Textarea
                ref={ref}
                value={comment}
                onChange={(e) => {
                    const newComment = e.target.value;
                    setComment(newComment);
                    onCommentChange?.(newComment);
                }}
                placeholder={placeholder} // Use dynamic placeholder here
                bg="transparent"
                _focus={{ border: "#A5D6A7", boxShadow: "none" }}
                resize="none"
                minHeight="100px"
                borderRadius="xl"
                border="1px solid grey"
                {...textareaProps} // Spread any other custom props for Textarea here
            />
            <Box mt={2} minHeight="24px">
                {renderHighlightedText(comment)}
            </Box>

            {isListVisible && authors.length > 0 && (
                <List position="absolute" top="100%" left={0} bg="white" boxShadow="md" zIndex="999" width="100%">
                    {isLoading ? (
                        <Spinner color="#A5D6A7" />
                    ) : (
                        authors.map((author) => (
                            <ListItem
                                key={author}
                                onClick={() => handleSelectUser(author)}
                                p={2}
                                cursor="pointer"
                                color="#ABE4B8"
                                display="flex"
                                backgroundColor="black"
                                alignItems="center"
                            >
                                <Avatar name={author} size="sm" mr={2} />
                                <Text color="white" fontSize="14px">
                                    {author}
                                </Text>
                            </ListItem>
                        ))
                    )}
                </List>
            )}
        </>
    );
};

export default MentionComment;
