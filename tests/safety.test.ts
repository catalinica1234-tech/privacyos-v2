import { describe, expect, it } from "vitest";
import {
  expandIpv6,
  isBlockedIp,
  isPrivateIp,
  isPrivateIpv4,
  isPrivateIpv6,
  resolveAndGuardHost,
  validateTargetUrl,
} from "@/lib/analyzer/safety";

/* Pruebas de la barrera anti-SSRF. No usan red: validan la decisión
   local sobre URLs, literales IP y (para literales) la resolución. */

function rechazo(raw: string, code?: string) {
  const r = validateTargetUrl(raw);
  expect(r.ok).toBe(false);
  if (!r.ok && code) expect(r.code).toBe(code);
  return r;
}

describe("validateTargetUrl · aceptación", () => {
  it.each([
    "https://example.com",
    "http://example.com/path?q=1",
    "https://sub.example.cl:443/",
    "http://example.com:80/",
    "https://xn--bcher-kva.example/",
  ])("acepta destino público %s", (url) => {
    const r = validateTargetUrl(url);
    expect(r.ok).toBe(true);
  });
});

describe("validateTargetUrl · protocolos, credenciales y puertos", () => {
  it("rechaza protocolos distintos de HTTP(S)", () => {
    rechazo("javascript:alert(1)", "PROTOCOLO_NO_PERMITIDO");
    rechazo("file:///etc/passwd", "PROTOCOLO_NO_PERMITIDO");
    rechazo("ftp://example.com/", "PROTOCOLO_NO_PERMITIDO");
    rechazo("data:text/html,hola", "PROTOCOLO_NO_PERMITIDO");
  });

  it("rechaza credenciales embebidas", () => {
    rechazo("https://user:pass@example.com/", "URL_INVALIDA");
  });

  it("rechaza puertos no estándar", () => {
    rechazo("https://example.com:8443/", "DESTINO_NO_SEGURO");
    rechazo("http://example.com:22/", "DESTINO_NO_SEGURO");
  });

  it("rechaza URLs inválidas, vacías o demasiado largas", () => {
    rechazo("", "URL_INVALIDA");
    rechazo("no es una url", "URL_INVALIDA");
    rechazo("https://" + "a".repeat(2048), "URL_INVALIDA");
  });

  it("rechaza hostnames sin dominio público", () => {
    rechazo("http://intranet/", "URL_INVALIDA");
    rechazo("http://exa mple.com/", "URL_INVALIDA");
  });
});

describe("validateTargetUrl · redes internas y metadatos", () => {
  it.each([
    "http://localhost/",
    "http://localhost.localdomain/",
    "http://metadata.google.internal/",
    "http://metadata.azure.internal/",
    "http://instance-data/",
    "http://servicio.local/",
    "http://caja.internal/",
    "http://impresora.lan/",
    "http://router.home/",
    "http://equipo.corp/",
    "http://api.cluster.local/",
  ])("bloquea hostname interno %s", (url) => {
    rechazo(url, "DESTINO_NO_SEGURO");
  });

  it.each([
    "http://127.0.0.1/",
    "http://127.1/",
    "http://2130706433/",
    "http://0x7f000001/",
    "http://0177.0.0.1/",
    "http://0.0.0.0/",
    "http://10.0.0.7/",
    "http://172.16.4.2/",
    "http://172.31.255.1/",
    "http://192.168.1.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://100.100.100.200/",
    "http://192.0.0.192/",
    "http://198.18.0.1/",
    "http://203.0.113.5/",
    "http://224.0.0.1/",
    "http://255.255.255.255/",
  ])("bloquea IPv4 privada/reservada %s", (url) => {
    rechazo(url, "DESTINO_NO_SEGURO");
  });

  it.each([
    "http://[::1]/",
    "http://[::]/",
    "http://[::ffff:127.0.0.1]/",
    "http://[::ffff:7f00:1]/",
    "http://[fe80::1]/",
    "http://[fc00::1]/",
    "http://[fd12:3456::1]/",
    "http://[ff02::1]/",
    "http://[2001:db8::1]/",
    "http://[2002:7f00:1::]/",
    "http://[64:ff9b::7f00:1]/",
  ])("bloquea IPv6 privada/reservada %s", (url) => {
    rechazo(url, "DESTINO_NO_SEGURO");
  });
});

describe("clasificación de IP", () => {
  it("reconoce IPv4 privadas y públicas", () => {
    expect(isPrivateIpv4("10.1.2.3")).toBe(true);
    expect(isPrivateIpv4("169.254.169.254")).toBe(true);
    expect(isPrivateIpv4("8.8.8.8")).toBe(false);
    expect(isPrivateIpv4("1.1.1.1")).toBe(false);
    expect(isPrivateIpv4("999.1.1.1")).toBe(false);
  });

  it("expande IPv6 y detecta rangos", () => {
    expect(expandIpv6("::1")).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    expect(expandIpv6("2001:db8::1")).toEqual([0x2001, 0x0db8, 0, 0, 0, 0, 0, 1]);
    expect(expandIpv6("::ffff:192.168.1.1")).toEqual([0, 0, 0, 0, 0, 0xffff, 0xc0a8, 0x0101]);
    expect(expandIpv6("no-es-ip")).toBeNull();
    expect(expandIpv6("fe80::1%eth0")).toBeNull();

    expect(isPrivateIpv6("fe80::1")).toBe(true);
    expect(isPrivateIpv6("2606:4700:4700::1111")).toBe(false);
  });

  it("isPrivateIp solo clasifica IP válidas", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("[::1]")).toBe(true);
    expect(isPrivateIp("example.com")).toBe(false);
    expect(isPrivateIp("vacio")).toBe(false);
  });

  it("isBlockedIp falla cerrado ante valores no clasificables", () => {
    expect(isBlockedIp("no-es-ip")).toBe(true);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
  });
});

describe("resolveAndGuardHost", () => {
  it("bloquea literales privados sin consultar DNS", async () => {
    expect(await resolveAndGuardHost("127.0.0.1")).toMatchObject({ ok: false, code: "DESTINO_NO_SEGURO" });
    expect(await resolveAndGuardHost("[::1]")).toMatchObject({ ok: false, code: "DESTINO_NO_SEGURO" });
    expect(await resolveAndGuardHost("169.254.169.254")).toMatchObject({ ok: false, code: "DESTINO_NO_SEGURO" });
  });

  it("acepta un literal público sin consultar DNS", async () => {
    expect(await resolveAndGuardHost("8.8.8.8")).toEqual({ ok: true, ips: ["8.8.8.8"] });
  });
});
