"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Loader2, UserPlus, X, Save, Plus, Trash2, Edit2, Check, X as XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Group, Participant, isUserParticipant, getParticipantDisplayName, getParticipantImage } from "@/types/tournament.type";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import GroupsIcon from "@mui/icons-material/Groups";
import AddCircleIcon from '@mui/icons-material/AddCircle';

interface ManageGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  groups: Group[];
  participants: Participant[];
  onUpdate: (groups: Group[]) => void;
  drawGenerated?: boolean;
  hasPlayedMatches?: boolean;
  numberOfGroups?: number; // Maximum number of groups allowed (from tournament config)
}

export function ManageGroupsDialog({
  open,
  onOpenChange,
  tournamentId,
  groups: initialGroups,
  participants,
  onUpdate,
  drawGenerated = false,
  hasPlayedMatches = false,
  numberOfGroups,
}: ManageGroupsDialogProps) {
  const [localGroups, setLocalGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editedGroupNames, setEditedGroupNames] = useState<Record<string, string>>({});
  const [groupNameErrors, setGroupNameErrors] = useState<Record<string, string>>({});

  // Initialize local groups when dialog opens
  useEffect(() => {
    if (open) {
      // Deep clone groups to avoid mutating original
      // If no groups exist, start with empty array
      if (initialGroups && initialGroups.length > 0) {
        setLocalGroups(
          initialGroups.map((group) => ({
            ...group,
            participants: [...group.participants],
          }))
        );
        // Initialize edited names with current group names
        const initialNames: Record<string, string> = {};
        initialGroups.forEach((group) => {
          initialNames[group.groupId] = group.groupName;
        });
        setEditedGroupNames(initialNames);
      } else {
        setLocalGroups([]);
        setEditedGroupNames({});
      }
      // Reset editing state when dialog opens
      setEditingGroupId(null);
      setGroupNameErrors({});
    }
  }, [open, initialGroups]);

  // Get all participants currently assigned to groups
  const getAssignedParticipantIds = () => {
    const assigned = new Set<string>();
    localGroups.forEach((group) => {
      group.participants.forEach((p) => {
        assigned.add(p._id);
      });
    });
    return assigned;
  };

  // Get unassigned participants
  const getUnassignedParticipants = () => {
    const assigned = getAssignedParticipantIds();
    return participants.filter((p) => !assigned.has(p._id));
  };

  // Add participant to a group
  const addParticipantToGroup = (groupId: string, participant: Participant) => {
    setLocalGroups((prev) =>
      prev.map((group) => {
        if (group.groupId === groupId) {
          // Check if participant is already in this group
          if (group.participants.some((p) => p._id === participant._id)) {
            return group;
          }
          return {
            ...group,
            participants: [...group.participants, participant],
          };
        }
        return group;
      })
    );
  };

  // Remove participant from a group
  const removeParticipantFromGroup = (
    groupId: string,
    participantId: string
  ) => {
    setLocalGroups((prev) =>
      prev.map((group) => {
        if (group.groupId === groupId) {
          return {
            ...group,
            participants: group.participants.filter(
              (p) => p._id !== participantId
            ),
          };
        }
        return group;
      })
    );
  };

  // Create a new group
  const createNewGroup = () => {
    // Check if we've reached the configured number of groups
    if (numberOfGroups && localGroups.length >= numberOfGroups) {
      toast.error(`Maximum number of groups reached (${numberOfGroups}). This tournament is configured for ${numberOfGroups} groups.`);
      return;
    }

    const groupLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const existingGroupIds = new Set(localGroups.map((g) => g.groupId));
    let newGroupId = "";
    let newGroupName = "";

    for (let i = 0; i < groupLabels.length; i++) {
      const label = groupLabels[i];
      if (!existingGroupIds.has(label)) {
        newGroupId = label;
        newGroupName = `Group ${label}`;
        break;
      }
    }

    if (!newGroupId) {
      toast.error("Maximum number of groups reached (26)");
      return;
    }

    setLocalGroups((prev) => [
      ...prev,
      {
        groupId: newGroupId,
        groupName: newGroupName,
        participants: [],
        rounds: [],
        standings: [],
      },
    ]);
    
    // Initialize edited name for the new group
    setEditedGroupNames((prev) => ({
      ...prev,
      [newGroupId]: newGroupName,
    }));
  };

  // Validate group name
  const validateGroupName = (groupId: string, name: string): string | null => {
    const trimmedName = name.trim();
    
    // Check empty
    if (!trimmedName) {
      return "Group name cannot be empty";
    }
    
    // Check length
    if (trimmedName.length > 50) {
      return "Group name must be 50 characters or less";
    }
    
    // Check uniqueness
    const duplicate = localGroups.find(
      (g) => g.groupId !== groupId && g.groupName === trimmedName
    );
    if (duplicate) {
      return "Group name must be unique";
    }
    
    return null; // Valid
  };

  // Start editing a group name
  const startEditingGroupName = (groupId: string) => {
    setEditingGroupId(groupId);
    const group = localGroups.find((g) => g.groupId === groupId);
    if (group) {
      setEditedGroupNames((prev) => ({
        ...prev,
        [groupId]: group.groupName,
      }));
      setGroupNameErrors((prev) => ({
        ...prev,
        [groupId]: "",
      }));
    }
  };

  // Cancel editing a group name
  const cancelEditingGroupName = (groupId: string) => {
    setEditingGroupId(null);
    const group = localGroups.find((g) => g.groupId === groupId);
    if (group) {
      setEditedGroupNames((prev) => ({
        ...prev,
        [groupId]: group.groupName,
      }));
    }
    setGroupNameErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[groupId];
      return newErrors;
    });
  };

  // Save edited group name
  const saveGroupName = (groupId: string) => {
    const editedName = editedGroupNames[groupId] || "";
    const error = validateGroupName(groupId, editedName);
    
    if (error) {
      setGroupNameErrors((prev) => ({
        ...prev,
        [groupId]: error,
      }));
      return;
    }
    
    // Update the group name in localGroups
    const trimmedName = editedName.trim();
    setLocalGroups((prev) =>
      prev.map((group) =>
        group.groupId === groupId
          ? { ...group, groupName: trimmedName }
          : group
      )
    );
    
    setEditingGroupId(null);
    setGroupNameErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[groupId];
      return newErrors;
    });
  };

  // Handle group name input change
  const handleGroupNameChange = (groupId: string, value: string) => {
    setEditedGroupNames((prev) => ({
      ...prev,
      [groupId]: value,
    }));
    
    // Clear error when user starts typing
    if (groupNameErrors[groupId]) {
      setGroupNameErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[groupId];
        return newErrors;
      });
    }
  };

  // Handle group name input blur (auto-save on blur)
  const handleGroupNameBlur = (groupId: string) => {
    const editedName = editedGroupNames[groupId] || "";
    const group = localGroups.find((g) => g.groupId === groupId);
    
    // If name hasn't changed, just cancel editing
    if (group && editedName.trim() === group.groupName) {
      cancelEditingGroupName(groupId);
      return;
    }
    
    // Otherwise, try to save
    saveGroupName(groupId);
  };

  // Handle group name input key down (Enter to save, Escape to cancel)
  const handleGroupNameKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    groupId: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveGroupName(groupId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditingGroupName(groupId);
    }
  };

  // Delete a group
  const deleteGroup = (groupId: string) => {
    const group = localGroups.find((g) => g.groupId === groupId);
    if (group && group.participants.length > 0) {
      toast.error(
        "Cannot delete group with participants. Remove all participants first."
      );
      return;
    }

    // Check if deleting would go below the required number of groups
    if (numberOfGroups && localGroups.length <= numberOfGroups) {
      toast.error(
        `Cannot delete group. This tournament requires exactly ${numberOfGroups} groups.`
      );
      return;
    }

    setLocalGroups((prev) => prev.filter((g) => g.groupId !== groupId));
  };

  // Save changes
  const handleSave = async () => {
    // Validate all group names before saving
    const validationErrors: Record<string, string> = {};
    for (const group of localGroups) {
      const error = validateGroupName(group.groupId, group.groupName);
      if (error) {
        validationErrors[group.groupId] = error;
      }
    }

    // If there are validation errors, show them and don't save
    if (Object.keys(validationErrors).length > 0) {
      setGroupNameErrors(validationErrors);
      toast.error("Please fix group name errors before saving");
      return;
    }

    setSaving(true);
    try {
      // Prepare groups data (only groupId, groupName, and participants)
      const groupsData = localGroups.map((group) => ({
        groupId: group.groupId,
        groupName: group.groupName.trim(), // Ensure trimmed
        participants: group.participants.map((p) => p._id),
      }));

      const { data } = await axiosInstance.put(
        `/tournaments/${tournamentId}/groups`,
        { groups: groupsData }
      );

      onUpdate(data.tournament.groups);
      toast.success("Groups updated successfully!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving groups:", err);
      toast.error(err.response?.data?.error || "Failed to save groups");
    } finally {
      setSaving(false);
    }
  };

  // Cancel changes
  const handleCancel = () => {
    setLocalGroups(
      initialGroups.map((group) => ({
        ...group,
        participants: [...group.participants],
      }))
    );
    onOpenChange(false);
  };

  const unassignedParticipants = getUnassignedParticipants();

  const getInitial = (name?: string) => name?.charAt(0)?.toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] rounded-none overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
          <DialogDescription>
            Add or remove players from groups. Drag players between groups or
            use the controls below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Unassigned Participants */}
          {unassignedParticipants.length > 0 && (
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  Unassigned Participants ({unassignedParticipants.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {unassignedParticipants.map((participant) => (
                  <div
                    key={participant._id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={getParticipantImage(participant)} />
                      <AvatarFallback className="text-xs">
                        {getInitial(getParticipantDisplayName(participant))}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">
                      {getParticipantDisplayName(participant)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {localGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GroupsIcon className="w-12 h-12 mx-auto opacity-50" />
                  <p className="text-sm">No groups created yet</p>
                  <p className="text-xs mt-1">
                    Create your first group to start organizing players
                  </p>
                </div>
              ) : (
                localGroups.map((group) => (
                  <div
                    key={group.groupId}
                    className="border rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {editingGroupId === group.groupId ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Input
                              value={editedGroupNames.hasOwnProperty(group.groupId) ? editedGroupNames[group.groupId] : group.groupName}
                              onChange={(e) => handleGroupNameChange(group.groupId, e.target.value)}
                              onBlur={() => handleGroupNameBlur(group.groupId)}
                              onKeyDown={(e) => handleGroupNameKeyDown(e, group.groupId)}
                              className="flex-1 min-w-0"
                              autoFocus
                              maxLength={50}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveGroupName(group.groupId)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelEditingGroupName(group.groupId)}
                              className="h-8 w-8 p-0"
                            >
                              <XIcon className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h3 
                              className="font-semibold text-base cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => startEditingGroupName(group.groupId)}
                              title="Click to edit group name"
                            >
                              {group.groupName}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingGroupName(group.groupId)}
                              className="h-6 w-6 p-0"
                              title="Edit group name"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Badge variant="secondary">
                          {group.participants.length} players
                        </Badge>
                      </div>
                      {groupNameErrors[group.groupId] && (
                        <div className="text-xs text-red-600 mr-2">
                          {groupNameErrors[group.groupId]}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGroup(group.groupId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Group Participants */}
                    <div className="space-y-2">
                      {group.participants.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {group.participants.map((participant) => (
                            <div
                              key={participant._id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg group"
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={getParticipantImage(participant)} />
                                <AvatarFallback className="text-xs">
                                  {getInitial(getParticipantDisplayName(participant))}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">
                                {getParticipantDisplayName(participant)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() =>
                                  removeParticipantFromGroup(
                                    group.groupId,
                                    participant._id
                                  )
                                }
                              >
                                <X className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No participants in this group
                        </p>
                      )}

                      {/* Add Participant Dropdown */}
                      {unassignedParticipants.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {unassignedParticipants.map((participant) => (
                              <Button
                                key={participant._id}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() =>
                                  addParticipantToGroup(
                                    group.groupId,
                                    participant
                                  )
                                }
                              >
                                <AddCircleIcon className="w-3 h-3 mr-1" />
                                Add{" "}
                                {getParticipantDisplayName(participant)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Create New Group Button */}
              {(!numberOfGroups || localGroups.length < numberOfGroups) && (
                <Button
                  variant="outline"
                  onClick={createNewGroup}
                  className="w-full"
                  disabled={numberOfGroups ? localGroups.length >= numberOfGroups : false}
                >
                  Create New Group
                </Button>
              )}
              {numberOfGroups && localGroups.length >= numberOfGroups && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  Maximum {numberOfGroups} groups configured for this tournament
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Changes</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
