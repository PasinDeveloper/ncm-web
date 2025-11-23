"use client";

import { useEffect, useRef, useState } from "react";
import { WebDavConfig, WebDavEntry, WebDavProtocol } from "@/types";
import {
  WEB_DAV_DEFAULT_PORT,
  WEB_DAV_DEFAULT_PROTOCOL,
  parseWebDavServerUrl,
} from "@/lib/webdav";
import {
  TbAlertTriangle,
  TbChevronDown,
  TbFolder,
  TbFolderOpen,
  TbShieldCheck,
  TbWorldDownload,
} from "react-icons/tb";

interface WebDavModalProps {
  isOpen: boolean;
  config: WebDavConfig;
  onConfigChange: (config: WebDavConfig) => void;
  onSubmit: (config: WebDavConfig) => void;
  onClose: () => void;
  entries: WebDavEntry[] | null;
  currentPath: string;
  selectedPath: string | null;
  onBrowse: (config?: WebDavConfig, pathOverride?: string) => void;
  onSelectPath: (path: string) => void;
  onGoUp: () => void;
  isListing: boolean;
  isFetching: boolean;
  rememberCredentials: boolean;
  hasSavedCredentials: boolean;
  onRememberChange: (value: boolean) => void;
  onClearSaved: () => void;
  error?: string | null;
}

export default function WebDavModal({
  isOpen,
  config,
  onConfigChange,
  onSubmit,
  onClose,
  entries,
  currentPath,
  selectedPath,
  onBrowse,
  onSelectPath,
  onGoUp,
  isListing,
  isFetching,
  rememberCredentials,
  hasSavedCredentials,
  onRememberChange,
  onClearSaved,
  error,
}: WebDavModalProps) {
  const protocolOptions: {
    value: WebDavProtocol;
    label: string;
    icon: typeof TbShieldCheck;
  }[] = [
    {
      value: "https",
      label: "https://",
      icon: TbShieldCheck,
    },
    {
      value: "http",
      label: "http://",
      icon: TbAlertTriangle,
    },
  ];

  const [isProtocolMenuOpen, setIsProtocolMenuOpen] = useState(false);
  const protocolDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProtocolMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        protocolDropdownRef.current &&
        !protocolDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProtocolMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProtocolMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProtocolMenuOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsProtocolMenuOpen(false);
    }
  }, [isOpen]);

  const currentProtocol = config.protocol || WEB_DAV_DEFAULT_PROTOCOL;
  const portInputValue = config.port || "";
  const effectivePort = portInputValue || WEB_DAV_DEFAULT_PORT[currentProtocol];
  const serverAddressValue = config.serverUrl || "";
  const selectedProtocolOption =
    protocolOptions.find((option) => option.value === currentProtocol) ||
    protocolOptions[0];
  const SelectedProtocolIcon = selectedProtocolOption.icon;

  const handleChange = (key: keyof WebDavConfig, value: string) => {
    onConfigChange({
      ...config,
      [key]: value,
    });
  };

  const handleServerAddressChange = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      onConfigChange({
        ...config,
        serverUrl: "",
      });
      return;
    }
    const parsed = parseWebDavServerUrl(
      trimmed,
      currentProtocol,
      effectivePort
    );
    const shouldAdoptParsedPort =
      parsed.explicitPort || !config.port || !config.port.trim();
    onConfigChange({
      ...config,
      serverUrl: parsed.address,
      protocol: parsed.protocol,
      port: shouldAdoptParsedPort ? parsed.port : config.port,
    });
  };

  const handleProtocolChange = (value: WebDavProtocol) => {
    const nextProtocol = value;
    const prevDefault = WEB_DAV_DEFAULT_PORT[currentProtocol];
    const shouldUpdatePort =
      !config.port || config.port === prevDefault || config.port === "";
    const nextPort = shouldUpdatePort
      ? WEB_DAV_DEFAULT_PORT[nextProtocol]
      : config.port;
    onConfigChange({
      ...config,
      protocol: nextProtocol,
      port: nextPort,
    });
    setIsProtocolMenuOpen(false);
  };

  const handlePortChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "").slice(0, 5);
    onConfigChange({
      ...config,
      port: sanitized,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      ...config,
      directory: selectedPath || config.directory,
    });
  };

  const disabled = isListing || isFetching;
  const directoryEntries = (entries || []).filter(
    (entry) => entry.type === "directory"
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl rounded-3xl bg-[#0b0b16] border border-white/10 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white">
            <TbWorldDownload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white">
              Load from WebDAV
            </h3>
            <p className="text-sm text-white/60">
              Connect to a WebDAV directory and import all available source
              files.
            </p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white/80">
              Server URL
            </label>
            <div
              className="grid gap-3 items-start"
              style={{ gridTemplateColumns: "11rem minmax(0,1fr) 5.5rem" }}
            >
              <div ref={protocolDropdownRef}>
                <span className="text-xs uppercase tracking-wide text-white/50">
                  Protocol
                </span>
                <div className="relative mt-1">
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 text-left text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    onClick={() => setIsProtocolMenuOpen((prev) => !prev)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-9 items-center justify-center rounded-xl text-base ${
                          currentProtocol === "https"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        <SelectedProtocolIcon className="w-4 h-4" />
                      </span>
                      <p className="text-sm font-semibold">
                        {selectedProtocolOption.label}
                      </p>
                    </div>
                    <TbChevronDown
                      className={`w-4 h-4 text-white/70 transition-transform ${
                        isProtocolMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isProtocolMenuOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-white/15 bg-[#111223] shadow-2xl">
                      <div className="py-2">
                        {protocolOptions.map((option) => {
                          const Icon = option.icon;
                          const isActive = option.value === currentProtocol;
                          return (
                            <button
                              type="button"
                              key={option.value}
                              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                                isActive
                                  ? "bg-white/10 text-white"
                                  : "text-white/80 hover:bg-white/5"
                              }`}
                              onClick={() => handleProtocolChange(option.value)}
                            >
                              <span
                                className={`flex size-9 items-center justify-center rounded-xl text-base ${
                                  option.value === "https"
                                    ? "bg-emerald-500/15 text-emerald-200"
                                    : "bg-amber-500/15 text-amber-200"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </span>
                              <p className="font-semibold">{option.label}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs uppercase tracking-wide text-white/50">
                  Host & Base Path
                </span>
                <input
                  value={serverAddressValue}
                  onChange={(e) => handleServerAddressChange(e.target.value)}
                  type="text"
                  placeholder="example.com/webdav"
                  className="mt-1 h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  required
                />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-white/50">
                  Port
                </span>
                <input
                  value={portInputValue}
                  onChange={(e) => handlePortChange(e.target.value)}
                  type="text"
                  inputMode="numeric"
                  placeholder={WEB_DAV_DEFAULT_PORT[currentProtocol]}
                  className="mt-1 h-12 w-full rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/80 flex items-center justify-between gap-4">
              <span>Directory Path</span>
              <button
                type="button"
                onClick={() => onBrowse(config)}
                className="text-xs font-semibold text-blue-300 hover:text-blue-200 disabled:text-white/30"
                disabled={disabled || !config.serverUrl}
              >
                {isListing ? "Connecting..." : "Connect"}
              </button>
            </label>
            <input
              value={config.directory}
              onChange={(e) => handleChange("directory", e.target.value)}
              type="text"
              placeholder="/music/library"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/80">
                Username (optional)
              </label>
              <input
                value={config.username || ""}
                onChange={(e) => handleChange("username", e.target.value)}
                type="text"
                placeholder="Username"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/80">
                Password (optional)
              </label>
              <input
                value={config.password || ""}
                onChange={(e) => handleChange("password", e.target.value)}
                type="password"
                placeholder="Password"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={rememberCredentials}
                onChange={(e) => onRememberChange(e.target.checked)}
                className="size-4 rounded border-white/40 bg-transparent"
              />
              Remember credentials on this device
            </label>
            {hasSavedCredentials && (
              <button
                type="button"
                onClick={onClearSaved}
                className="text-xs font-semibold text-red-200 hover:text-red-100 underline underline-offset-2"
              >
                Clear saved credentials
              </button>
            )}
          </div>

          {(entries || isListing) && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-white/70">
                  Current folder:{" "}
                  <span className="text-white">{currentPath}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onGoUp}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-50"
                    disabled={disabled || currentPath === "/"}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => onBrowse(config, currentPath)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-50"
                    disabled={disabled}
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/5 bg-black/20 divide-y divide-white/5">
                {isListing ? (
                  <div className="px-4 py-6 text-center text-white/70 text-sm">
                    Listing folders...
                  </div>
                ) : directoryEntries.length === 0 ? (
                  <div className="px-4 py-6 text-center text-white/50 text-sm">
                    No subdirectories found.
                  </div>
                ) : (
                  directoryEntries.map((entry) => {
                    const fullPath =
                      entry.filename ||
                      `${currentPath === "/" ? "" : currentPath}/${
                        entry.basename
                      }`;
                    const isSelected = selectedPath === fullPath;
                    return (
                      <div
                        key={fullPath}
                        className={`flex items-center gap-3 px-4 py-3 text-white/80 ${
                          isSelected ? "bg-white/10" : "bg-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isSelected ? (
                            <TbFolderOpen className="w-5 h-5 text-blue-300" />
                          ) : (
                            <TbFolder className="w-5 h-5 text-white/60" />
                          )}
                          <span className="truncate">
                            {entry.basename || fullPath}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onBrowse(config, fullPath)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-40"
                            disabled={disabled}
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectPath(fullPath)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-600/80 text-white hover:bg-blue-600 disabled:opacity-40"
                            disabled={disabled}
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-white/50">
                Choose a directory first, then fetch its decoded files.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full md:w-auto px-5 py-3 rounded-2xl border border-white/20 text-white/80 font-semibold hover:bg-white/5 transition-colors"
              disabled={disabled}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isFetching || !selectedPath}
            >
              {isFetching ? "Fetching..." : "Fetch Files"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
