import React, { useState } from 'react';
import { Button } from './button';
import { Trash2, Plus } from 'lucide-react';

interface LinkRow {
    id: string;
    url: string;
}

interface LinkSheetEditorProps {
    links: LinkRow[];
    onChange: (links: LinkRow[]) => void;
    placeholder?: string;
}

export function LinkSheetEditor({ links, onChange, placeholder = "Enter URL..." }: LinkSheetEditorProps) {
    const addRow = () => {
        const newRow: LinkRow = {
            id: `row-${Date.now()}-${Math.random()}`,
            url: ''
        };
        onChange([...links, newRow]);
    };

    const removeRow = (id: string) => {
        onChange(links.filter(row => row.id !== id));
    };

    const updateUrl = (id: string, url: string) => {
        onChange(links.map(row => row.id === id ? { ...row, url } : row));
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, rowId: string) => {
        const pastedText = e.clipboardData.getData('text');

        // Check if pasted text contains multiple lines (e.g., from Excel/Sheets)
        const lines = pastedText.split(/[\n\r]+/).filter(line => line.trim());

        if (lines.length > 1) {
            e.preventDefault();

            // Find the index of the current row
            const currentIndex = links.findIndex(row => row.id === rowId);

            // Create new rows for pasted data
            const newLinks = [...links];

            // Update current row with first line
            newLinks[currentIndex] = { ...newLinks[currentIndex], url: lines[0].trim() };

            // Add new rows for remaining lines
            for (let i = 1; i < lines.length; i++) {
                newLinks.splice(currentIndex + i, 0, {
                    id: `row-${Date.now()}-${Math.random()}-${i}`,
                    url: lines[i].trim()
                });
            }

            onChange(newLinks);
        }
    };

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">URL</span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addRow}
                    className="h-7 gap-1 text-xs"
                >
                    <Plus className="w-3 h-3" />
                    Add Row
                </Button>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {links.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No links added yet. Click "Add Row" to start.
                    </div>
                ) : (
                    links.map((row, index) => (
                        <div key={row.id} className="flex items-center gap-2 px-4 py-2 hover:bg-muted/30 transition-colors">
                            <span className="text-xs text-muted-foreground w-8">{index + 1}</span>
                            <input
                                type="text"
                                value={row.url}
                                onChange={(e) => updateUrl(row.id, e.target.value)}
                                onPaste={(e) => handlePaste(e, row.id)}
                                placeholder={placeholder}
                                className="flex-1 bg-transparent border-none outline-none text-sm focus:ring-0 px-2 py-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRow(row.id)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Info */}
            <div className="bg-muted/30 border-t border-border px-4 py-2">
                <p className="text-xs text-muted-foreground">
                    {links.length} {links.length === 1 ? 'link' : 'links'} • Paste multiple URLs to add them at once
                </p>
            </div>
        </div>
    );
}
