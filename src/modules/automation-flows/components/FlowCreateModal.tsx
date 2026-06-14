import { useState } from "react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { Textarea } from "@components/ui/Textarea";

interface FlowCreateModalProps {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onCreate: (values: { name: string; description: string }) => Promise<void>;
}

export function FlowCreateModal({
  open,
  busy,
  onClose,
  onCreate,
}: Readonly<FlowCreateModalProps>) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await onCreate({ name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Create automation flow">
      <form className="space-y-5" onSubmit={submit}>
        <Input
          label="Flow name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Order status assistant"
          maxLength={120}
          autoFocus
          required
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe what this automation handles."
          maxLength={2000}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Creating..." : "Create flow"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
