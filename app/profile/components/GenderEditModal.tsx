// app/profile/components/GenderEditModal.tsx
"use client";

import { useState } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface GenderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGender?: string;
}

const GenderEditModal = ({ isOpen, onClose, currentGender }: GenderEditModalProps) => {
  const [selectedGender, setSelectedGender] = useState(currentGender || "");
  const [isSaving, setIsSaving] = useState(false);
  const { fetchUser } = useAuthStore();

  const handleSave = async () => {
    if (!selectedGender) {
      toast.error("Please select a gender");
      return;
    }

    setIsSaving(true);
    try {
      const response = await axiosInstance.patch("/profile/update", {
        gender: selectedGender,
      });

      if (response.data.success) {
        toast.success("Gender updated successfully!");
        await fetchUser();
        onClose();
      }
    } catch (error) {
      toast.error("Failed to update gender");
      console.error("Error updating gender:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Update Gender</h2>
        <Select value={selectedGender} onValueChange={setSelectedGender}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenderEditModal;