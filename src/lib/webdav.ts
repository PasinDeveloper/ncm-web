import { WebDavProtocol } from "@/types";

export const WEB_DAV_DEFAULT_PROTOCOL: WebDavProtocol = "https";

export const WEB_DAV_DEFAULT_PORT: Record<WebDavProtocol, string> = {
  http: "80",
  https: "443",
};

interface ParsedServerResult {
  address: string;
  protocol: WebDavProtocol;
  port: string;
  explicitPort: boolean;
}

export const normalizeWebDavPath = (input?: string) => {
  if (!input) return "/";
  let normalized = input.trim().replace(/\\/g, "/");
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/\/+/g, "/");
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || "/";
};

export const getParentWebDavPath = (path: string) => {
  if (!path || path === "/") return "/";
  const trimmed = path.replace(/\/$/, "");
  const segments = trimmed.split("/");
  segments.pop();
  const parent = segments.join("/");
  return parent ? (parent.startsWith("/") ? parent : `/${parent}`) : "/";
};

export const buildRemotePath = (basePath: string, basename?: string) => {
  if (!basename) return basePath;
  const normalizedBase = normalizeWebDavPath(basePath);
  return normalizedBase === "/"
    ? `/${basename}`
    : `${normalizedBase}/${basename}`;
};

export const sanitizeServerUrl = (serverUrl: string) => {
  const parsed = new URL(serverUrl);
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS WebDAV endpoints are supported.");
  }
  return parsed.origin + parsed.pathname.replace(/\/$/, "");
};

export const parseWebDavServerUrl = (
  raw: string,
  fallbackProtocol: WebDavProtocol = WEB_DAV_DEFAULT_PROTOCOL,
  fallbackPort?: string
): ParsedServerResult => {
  const trimmed = (raw || "").trim();
  const basePort = fallbackPort || WEB_DAV_DEFAULT_PORT[fallbackProtocol];
  if (!trimmed) {
    return {
      address: "",
      protocol: fallbackProtocol,
      port: basePort,
      explicitPort: false,
    };
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `${fallbackProtocol}://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    const protocol =
      (parsed.protocol.replace(":", "") as WebDavProtocol) || fallbackProtocol;
    const pathname =
      parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    const normalizedHost = parsed.hostname.includes(":")
      ? `[${parsed.hostname}]`
      : parsed.hostname;
    const portFromUrl = parsed.port || "";
    const port = portFromUrl || fallbackPort || WEB_DAV_DEFAULT_PORT[protocol];
    return {
      address: `${normalizedHost}${pathname}`,
      protocol,
      port,
      explicitPort: Boolean(portFromUrl),
    };
  } catch {
    const cleaned = trimmed.replace(/^https?:\/\//i, "");
    const slashIndex = cleaned.indexOf("/");
    const hostPart = slashIndex === -1 ? cleaned : cleaned.slice(0, slashIndex);
    const pathPart =
      slashIndex === -1 ? "" : cleaned.slice(slashIndex).replace(/\/$/, "");

    let derivedPort = basePort;
    let hostnameOnly = hostPart;

    let explicitPort = false;

    if (hostPart.startsWith("[")) {
      const closingIdx = hostPart.indexOf("]");
      if (closingIdx !== -1) {
        const remainder = hostPart.slice(closingIdx + 1);
        const portMatch = remainder.match(/^:(\d+)$/);
        if (portMatch) {
          derivedPort = portMatch[1];
          hostnameOnly = hostPart.slice(0, closingIdx + 1);
          explicitPort = true;
        }
      }
    } else {
      const portMatch = hostPart.match(/:(\d+)$/);
      if (portMatch) {
        derivedPort = portMatch[1];
        hostnameOnly = hostPart.slice(0, -portMatch[0].length);
        explicitPort = true;
      }
    }

    return {
      address: `${hostnameOnly}${pathPart}`,
      protocol: fallbackProtocol,
      port: derivedPort,
      explicitPort,
    };
  }
};

export const composeWebDavServerUrl = (
  address: string,
  protocol: WebDavProtocol = WEB_DAV_DEFAULT_PROTOCOL,
  port?: string
) => {
  const trimmed = (address || "").trim();
  if (!trimmed) return "";

  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const candidate = hasProtocol ? trimmed : `${protocol}://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    parsed.protocol = `${protocol}:`;
    if (port && port.trim()) {
      parsed.port = port.trim();
    } else if (!port && parsed.port) {
      // keep existing explicit port from address
    } else {
      parsed.port = "";
    }
    return sanitizeServerUrl(parsed.toString());
  } catch {
    return "";
  }
};
