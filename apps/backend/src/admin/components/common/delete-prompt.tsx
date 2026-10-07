import { Trash } from "@medusajs/icons";
import { Button, Prompt } from "@medusajs/ui";

interface DeletePromptProps {
  handleDelete: () => void;
  loading: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  description?: string;
}

export const DeletePrompt = ({
  handleDelete,
  loading,
  open,
  setOpen,
  description = "Are you sure you want to delete this item? This action cannot be undone.",
}: DeletePromptProps) => {
  const handleConfirmDelete = async () => {
    handleDelete();
    setOpen(false);
  };

  return (
    <Prompt open={open} onOpenChange={setOpen}>
      <Prompt.Content className="p-4 pb-0 border-b shadow-ui-fg-shadow">
        <Prompt.Title>Confirm Deletion</Prompt.Title>
        <Prompt.Description>{description}</Prompt.Description>
        <Prompt.Footer>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            isLoading={loading}
          >
            <Trash />
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
};
