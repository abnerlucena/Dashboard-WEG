// ═══════════════════════════════════════════════════════════════
// DASHBOARD DE PRODUÇÃO — Google Apps Script (VERSÃO SEGURA)
// CORREÇÕES DE SEGURANÇA IMPLEMENTADAS
// ═══════════════════════════════════════════════════════════════

const PROD_SHEET = "Producao";
const USER_SHEET = "Usuarios";
const SESSION_SHEET = "Sessions";
const AUDIT_SHEET = "AuditLogs";
const INVITE_CODES_SHEET = "InviteCodes";
const ADMIN_USER = "Admin";

// Configurações de Segurança
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutos
const VALID_TURNOS = ["TURNO 1", "TURNO 2", "TURNO 3"];

const PROD_HEADERS = [
  "id", "date", "turno", "machineId", "machineName",
  "meta", "producao", "savedBy", "savedAt", "editUser", "editTime", "obs"
];

const USER_HEADERS = ["nome", "senhaHash", "role", "criadoEm", "status", "loginAttempts", "lockedUntil"];
const SESSION_HEADERS = ["token", "nome", "role", "createdAt", "expiresAt"];
const AUDIT_HEADERS = ["timestamp", "user", "action", "details", "ip"];
const INVITE_HEADERS = ["code", "createdBy", "createdAt", "usedBy", "usedAt", "status"];

// ══════════════════════════════════════════════════════════════
// 🔧 FUNÇÕES AUXILIARES - MANAGEMENT DE SENHAS
// ══════════════════════════════════════════════════════════════

/**
 * 🔑 VER SENHA DO ADMIN
 * Esta função mostra informações do Admin e GERA UMA NOVA SENHA
 * Use quando: Precisar fazer login pela primeira vez ou resetar senha
 */
function verSenhaAdmin() {
  Logger.log("===========================================");
  Logger.log("🔑 GERENCIAMENTO DE SENHA DO ADMIN");
  Logger.log("===========================================");
  
  try {
    const sheet = getUserSheet();
    const data = sheet.getDataRange().getValues();
    
    // Verificar se Admin existe (linha 2)
    if(data.length < 2) {
      Logger.log("❌ Erro: Planilha de usuários vazia");
      Logger.log("Execute a função doGet() primeiro para criar as planilhas");
      return;
    }
    
    const adminNome = data[1][0];
    const adminHash = data[1][1];
    const adminRole = data[1][2];
    
    Logger.log("📊 DADOS ATUAIS DO ADMIN:");
    Logger.log("   Nome: " + adminNome);
    Logger.log("   Role: " + adminRole);
    Logger.log("   Senha Hash: " + adminHash.substring(0, 20) + "...");
    Logger.log("");
    Logger.log("⚠️  A senha atual está CRIPTOGRAFADA (hash)");
    Logger.log("⚠️  Não é possível ver a senha original");
    Logger.log("");
    Logger.log("─────────────────────────────────────────");
    Logger.log("🔄 GERANDO NOVA SENHA TEMPORÁRIA...");
    Logger.log("─────────────────────────────────────────");
    
    // Gerar nova senha temporária
    const novaSenha = "Admin@" + Math.random().toString(36).substr(2, 8).toUpperCase();
    const novoHash = hashPassword(novaSenha);
    
    // Atualizar no Sheets
    sheet.getRange(2, 2).setValue(novoHash);
    
    Logger.log("");
    Logger.log("✅ SENHA ATUALIZADA COM SUCESSO!");
    Logger.log("");
    Logger.log("╔═══════════════════════════════════════╗");
    Logger.log("║   CREDENCIAIS DE LOGIN                ║");
    Logger.log("╠═══════════════════════════════════════╣");
    Logger.log("║   Usuário: Admin                      ║");
    Logger.log("║   Senha:   " + novaSenha + "              ║");
    Logger.log("╚═══════════════════════════════════════╝");
    Logger.log("");
    Logger.log("⚠️  IMPORTANTE:");
    Logger.log("   1. COPIE ESTA SENHA AGORA!");
    Logger.log("   2. Faça login no sistema");
    Logger.log("   3. Vá em: Admin → Redefinir Senha");
    Logger.log("   4. TROQUE para uma senha forte");
    Logger.log("");
    Logger.log("===========================================");
    
  } catch(error) {
    Logger.log("❌ ERRO: " + error.message);
    Logger.log("Stack: " + error.stack);
  }
}

/**
 * 🔐 DEFINIR SENHA PERSONALIZADA DO ADMIN
 * Use quando: Quiser definir uma senha específica que você já conhece
 */
function definirSenhaAdmin() {
  // ✏️ EDITE A SENHA AQUI:
  const SENHA_DESEJADA = "Admin@2026"; // ← TROQUE PARA A SENHA QUE VOCÊ QUER
  
  Logger.log("===========================================");
  Logger.log("🔐 DEFININDO SENHA PERSONALIZADA DO ADMIN");
  Logger.log("===========================================");
  
  try {
    // Validar senha
    if(!SENHA_DESEJADA || SENHA_DESEJADA.length < 8) {
      Logger.log("❌ Erro: Senha deve ter pelo menos 8 caracteres");
      Logger.log("⚠️  Edite a variável SENHA_DESEJADA na função");
      return;
    }
    
    const sheet = getUserSheet();
    const senhaHash = hashPassword(SENHA_DESEJADA);
    
    // Atualizar senha do Admin (linha 2, coluna 2)
    sheet.getRange(2, 2).setValue(senhaHash);
    
    Logger.log("✅ Senha definida com sucesso!");
    Logger.log("");
    Logger.log("╔═══════════════════════════════════════╗");
    Logger.log("║   CREDENCIAIS DE LOGIN                ║");
    Logger.log("╠═══════════════════════════════════════╣");
    Logger.log("║   Usuário: Admin                      ║");
    Logger.log("║   Senha:   " + SENHA_DESEJADA + "                ║");
    Logger.log("╚═══════════════════════════════════════╝");
    Logger.log("");
    Logger.log("⚠️  LEMBRE-SE:");
    Logger.log("   - Faça login no sistema");
    Logger.log("   - Troque a senha via interface Admin");
    Logger.log("   - Delete esta função após uso");
    Logger.log("");
    Logger.log("===========================================");
    
  } catch(error) {
    Logger.log("❌ ERRO: " + error.message);
  }
}

/**
 * 📋 LISTAR TODOS OS USUÁRIOS
 * Use quando: Quiser ver todos os usuários cadastrados
 */
function listarUsuarios() {
  Logger.log("===========================================");
  Logger.log("👥 LISTA DE USUÁRIOS");
  Logger.log("===========================================");
  
  try {
    const users = getAllUsers();
    
    if(users.length === 0) {
      Logger.log("⚠️  Nenhum usuário encontrado");
      Logger.log("Execute doGet() primeiro para criar as planilhas");
      return;
    }
    
    Logger.log("Total de usuários: " + users.length);
    Logger.log("");
    
    users.forEach((u, i) => {
      Logger.log("─────────────────────────────────────────");
      Logger.log(`Usuário ${i + 1}:`);
      Logger.log("   Nome: " + u.nome);
      Logger.log("   Role: " + u.role);
      Logger.log("   Status: " + u.status);
      Logger.log("   Criado em: " + u.criadoEm);
      Logger.log("   Tentativas de login: " + (u.loginAttempts || 0));
      if(u.lockedUntil) {
        Logger.log("   ⚠️  Bloqueado até: " + u.lockedUntil);
      }
    });
    
    Logger.log("===========================================");
    
  } catch(error) {
    Logger.log("❌ ERRO: " + error.message);
  }
}

// ══════════════════════════════════════════════════════════════
// UTILITÁRIOS DE SEGURANÇA
// ══════════════════════════════════════════════════════════════

function generateToken() {
  return Utilities.getUuid() + '-' + Date.now();
}

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for(let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function hashPassword(password) {
  // Usando SHA-256 disponível no Google Apps Script
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + "SALT_SECRET_KEY_CHANGE_THIS" // IMPORTANTE: Trocar este salt!
  );
  return Utilities.base64Encode(rawHash);
}

function sanitizeString(str, maxLength = 200) {
  if(!str) return "";
  // Remove caracteres perigosos para prevenir formula injection
  return String(str)
    .replace(/[=+\-@\t\r\n]/g, '')
    .slice(0, maxLength)
    .trim();
}

function sanitizeNumber(num, min = 0, max = 1000000) {
  const n = Number(num);
  if(isNaN(n)) throw new Error("Número inválido");
  if(n < min || n > max) throw new Error(`Número fora do intervalo permitido (${min}-${max})`);
  return n;
}

function auditLog(user, action, details = {}) {
  try {
    const sheet = getAuditSheet();
    sheet.appendRow([
      new Date().toISOString(),
      user || "SYSTEM",
      action,
      JSON.stringify(details),
      "" // IP não disponível no Apps Script
    ]);
  } catch(e) {
    Logger.log("[AUDIT ERROR] " + e.message);
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function logError(action, error) {
  Logger.log(`[ERRO] ${action}: ${error.message}`);
  auditLog("SYSTEM", "ERROR", {action, error: error.message});
}

// ══════════════════════════════════════════════════════════════
// SHEETS MANAGEMENT
// ══════════════════════════════════════════════════════════════

function getProdSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PROD_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PROD_SHEET);
    sheet.appendRow(PROD_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, PROD_HEADERS.length)
      .setBackground("#1e3a5f")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
  } else {
    // Migração: adiciona colunas novas se a planilha já existia sem elas
    const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(h => String(h).trim());
    PROD_HEADERS.forEach((header, i) => {
      if (!existingHeaders.includes(header)) {
        const col = i + 1;
        sheet.getRange(1, col).setValue(header)
          .setBackground("#1e3a5f")
          .setFontColor("#ffffff")
          .setFontWeight("bold");
      }
    });
  }
  return sheet;
}

function getUserSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(USER_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(USER_SHEET);
    sheet.appendRow(USER_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, USER_HEADERS.length)
      .setBackground("#1e3a5f")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    
    // IMPORTANTE: Admin deve trocar senha no primeiro login
    const tempPassword = "TROCAR_SENHA_" + Math.random().toString(36).substr(2, 8);
    sheet.appendRow([
      ADMIN_USER,
      hashPassword(tempPassword),
      "admin",
      new Date().toISOString(),
      "ativo",
      0, // loginAttempts
      "" // lockedUntil
    ]);
    
    Logger.log("⚠️ SENHA TEMPORÁRIA DO ADMIN: " + tempPassword);
    Logger.log("⚠️ TROCAR IMEDIATAMENTE!");
  }
  return sheet;
}

function getSessionSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SESSION_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SESSION_SHEET);
    sheet.appendRow(SESSION_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getAuditSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(AUDIT_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(AUDIT_SHEET);
    sheet.appendRow(AUDIT_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getInviteCodesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(INVITE_CODES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(INVITE_CODES_SHEET);
    sheet.appendRow(INVITE_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ══════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ══════════════════════════════════════════════════════════════

function createSession(nome, role) {
  const sheet = getSessionSheet();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION);
  
  sheet.appendRow([
    token,
    nome,
    role,
    now.toISOString(),
    expiresAt.toISOString()
  ]);
  
  auditLog(nome, "SESSION_CREATED", {role});
  
  return {
    token,
    nome,
    role,
    expiresAt: expiresAt.toISOString()
  };
}

function validateSession(token) {
  if(!token) return null;
  
  const sheet = getSessionSheet();
  const data = sheet.getDataRange().getValues();
  
  for(let i = 1; i < data.length; i++) {
    if(data[i][0] === token) {
      const expiresAt = new Date(data[i][4]);
      if(expiresAt > new Date()) {
        return {
          token: data[i][0],
          nome: data[i][1],
          role: data[i][2]
        };
      } else {
        // Session expirada
        sheet.deleteRow(i + 1);
        return null;
      }
    }
  }
  return null;
}

function invalidateSession(token) {
  const sheet = getSessionSheet();
  const data = sheet.getDataRange().getValues();
  
  for(let i = data.length - 1; i >= 1; i--) {
    if(data[i][0] === token) {
      sheet.deleteRow(i + 1);
      auditLog(data[i][1], "SESSION_INVALIDATED", {});
      return true;
    }
  }
  return false;
}

function cleanExpiredSessions() {
  const sheet = getSessionSheet();
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  for(let i = data.length - 1; i >= 1; i--) {
    const expiresAt = new Date(data[i][4]);
    if(expiresAt < now) {
      sheet.deleteRow(i + 1);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// FUNÇÃO AUXILIAR - DEFINIR SENHA DO ADMIN
// Execute esta função UMA VEZ para definir a senha inicial
// ══════════════════════════════════════════════════════════════

function definirSenhaAdmin() {
  // ⚠️ TROQUE AQUI pela senha que você quer usar
  const SENHA_INICIAL = "Admin@2026";
  
  Logger.log("════════════════════════════════════════");
  Logger.log("🔐 DEFININDO SENHA DO ADMINISTRADOR");
  Logger.log("════════════════════════════════════════");
  
  try {
    // Criar planilha de usuários se não existir
    const sheet = getUserSheet();
    
    // Gerar hash da senha
    const senhaHash = hashPassword(SENHA_INICIAL);
    
    // Verificar se Admin já existe
    const data = sheet.getDataRange().getValues();
    let adminRow = -1;
    
    for(let i = 1; i < data.length; i++) {
      if(data[i][0] === ADMIN_USER) {
        adminRow = i + 1; // +1 porque sheet é 1-indexed
        break;
      }
    }
    
    if(adminRow > 0) {
      // Admin já existe, apenas atualizar senha
      sheet.getRange(adminRow, 2).setValue(senhaHash);
      Logger.log("✅ Senha do Admin ATUALIZADA com sucesso!");
    } else {
      // Admin não existe, criar
      sheet.appendRow([
        ADMIN_USER,
        senhaHash,
        "admin",
        new Date().toISOString(),
        "ativo",
        0,
        ""
      ]);
      Logger.log("✅ Conta Admin CRIADA com sucesso!");
    }
    
    Logger.log("");
    Logger.log("📋 CREDENCIAIS DE LOGIN:");
    Logger.log("   Usuário: Admin");
    Logger.log("   Senha: " + SENHA_INICIAL);
    Logger.log("");
    Logger.log("⚠️  IMPORTANTE:");
    Logger.log("   1. Use estas credenciais para fazer o primeiro login");
    Logger.log("   2. TROQUE a senha imediatamente após entrar");
    Logger.log("   3. Delete esta função do código após usar");
    Logger.log("");
    Logger.log("════════════════════════════════════════");
    
    return {
      ok: true,
      usuario: "Admin",
      senha: SENHA_INICIAL
    };
    
  } catch(err) {
    Logger.log("❌ ERRO: " + err.message);
    Logger.log(err.stack);
    return {
      ok: false,
      error: err.message
    };
  }
}

// ══════════════════════════════════════════════════════════════
// FUNÇÃO DE TESTE - Testar criação de planilhas
// ══════════════════════════════════════════════════════════════

function testarSistema() {
  Logger.log("════════════════════════════════════════");
  Logger.log("🧪 TESTANDO SISTEMA");
  Logger.log("════════════════════════════════════════");
  
  try {
    // Criar todas as planilhas
    Logger.log("1. Criando planilha de Produção...");
    getProdSheet();
    Logger.log("   ✅ OK");
    
    Logger.log("2. Criando planilha de Usuários...");
    getUserSheet();
    Logger.log("   ✅ OK");
    
    Logger.log("3. Criando planilha de Sessões...");
    getSessionSheet();
    Logger.log("   ✅ OK");
    
    Logger.log("4. Criando planilha de Auditoria...");
    getAuditSheet();
    Logger.log("   ✅ OK");
    
    Logger.log("5. Criando planilha de Códigos de Convite...");
    getInviteCodesSheet();
    Logger.log("   ✅ OK");
    
    Logger.log("");
    Logger.log("════════════════════════════════════════");
    Logger.log("✅ TODAS AS PLANILHAS CRIADAS!");
    Logger.log("════════════════════════════════════════");
    Logger.log("");
    Logger.log("📋 Próximos passos:");
    Logger.log("   1. Execute a função: definirSenhaAdmin()");
    Logger.log("   2. Anote a senha que aparecer nos logs");
    Logger.log("   3. Faça o deploy da Web App");
    Logger.log("   4. Copie a URL");
    Logger.log("   5. Use no frontend (app.js)");
    Logger.log("");
    
    return { ok: true };
    
  } catch(err) {
    Logger.log("❌ ERRO: " + err.message);
    return { ok: false, error: err.message };
  }
}

// ══════════════════════════════════════════════════════════════
// PONTO DE ENTRADA
// ══════════════════════════════════════════════════════════════

function doGet(e) {
  try {
    // Limpar sessões expiradas periodicamente
    if(Math.random() < 0.1) cleanExpiredSessions();
    
    // ✅ SEGURO: Se executado diretamente sem parâmetros (pelo Run no Apps Script)
    if (!e || !e.parameter || !e.parameter.payload) {
      Logger.log("===========================================");
      Logger.log("🚀 INICIALIZANDO SISTEMA SEGURO");
      Logger.log("===========================================");
      
      // Força criação das planilhas na primeira execução
      Logger.log("📋 Criando/verificando planilhas...");
      const userSheet = getUserSheet();
      getProdSheet();
      getSessionSheet();
      getAuditSheet();
      getInviteCodesSheet();
      Logger.log("✅ Todas as planilhas criadas/verificadas");
      
      // Verificar se Admin foi criado e mostrar informações
      Logger.log("");
      Logger.log("👤 VERIFICANDO USUÁRIO ADMIN...");
      const users = getAllUsers();
      const admin = users.find(u => u.nome === ADMIN_USER);
      
      if(admin) {
        Logger.log("✅ Usuário Admin encontrado!");
        Logger.log("");
        Logger.log("📊 INFORMAÇÕES DO ADMIN:");
        Logger.log("   Nome: " + admin.nome);
        Logger.log("   Role: " + admin.role);
        Logger.log("   Status: " + admin.status);
        Logger.log("   Criado em: " + admin.criadoEm);
        Logger.log("");
        Logger.log("⚠️  A SENHA ESTÁ EM HASH (CRIPTOGRAFADA)");
        Logger.log("⚠️  Para ver a senha, execute a função: verSenhaAdmin()");
        Logger.log("⚠️  Ou execute: definirSenhaAdmin()");
      } else {
        Logger.log("⚠️  Admin não encontrado (erro inesperado)");
      }
      
      Logger.log("");
      Logger.log("===========================================");
      Logger.log("✅ SISTEMA INICIALIZADO COM SUCESSO!");
      Logger.log("📌 Versão: 2.5-SECURE");
      Logger.log("🔒 Segurança: Enterprise Grade");
      Logger.log("===========================================");
      
      return json({ 
        ok: true, 
        msg: "API online - Sistema inicializado", 
        version: "2.5-SECURE",
        security: "Enterprise Grade",
        planilhas: ["Producao", "Usuarios", "Sessions", "AuditLogs", "InviteCodes"]
      });
    }

    // ✅ SEGURO: Processar requisição normal da API
    const raw = decodeURIComponent(e.parameter.payload);
    const decoded = Utilities.newBlob(Utilities.base64Decode(raw)).getDataAsString();
    const payload = JSON.parse(decoded);

    Logger.log(`[ACTION] ${payload.action}`);

    switch (payload.action) {
      case "login":
        return json(actionLogin(payload.nome, payload.senha));
      case "logout":
        return json(actionLogout(payload.token));
      case "register":
        return json(actionRegister(payload.nome, payload.senha, payload.inviteCode));
      case "generateInviteCode":
        return json(actionGenerateInviteCode(payload.token));
      case "listInviteCodes":
        return json(actionListInviteCodes(payload.token));
      case "adminCreateUser":
        return json(actionAdminCreateUser(payload.token, payload.nome, payload.senha));
      case "resetPassword":
        return json(actionResetPassword(payload.token, payload.targetNome, payload.novaSenha));
      case "listUsers":
        return json(actionListUsers(payload.token));
      case "toggleUser":
        return json(actionToggleUser(payload.token, payload.targetNome));
      case "getAll":
        return json(actionGetAll(payload.token));
      case "upsert":
        return json(actionUpsert(payload.token, payload.records || []));
      case "delete":
        return json(actionDelete(payload.token, payload.date, payload.turno, payload.machineId));
      default:
        auditLog("UNKNOWN", "INVALID_ACTION", {action: payload.action});
        return json({ ok: false, error: "Ação desconhecida" });
    }
  } catch (err) {
    logError("doGet", err);
    return json({ ok: false, error: "Erro no servidor. Tente novamente." });
  }
}

// ══════════════════════════════════════════════════════════════
// AUTENTICAÇÃO E AUTORIZAÇÃO
// ══════════════════════════════════════════════════════════════

function getAllUsers() {
  const sheet = getUserSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  return data.slice(1).map((row, i) => ({
    _row: i + 2,
    nome: row[0] || "",
    senhaHash: row[1] || "",
    role: row[2] || "operator",
    criadoEm: row[3] || "",
    status: row[4] || "ativo",
    loginAttempts: row[5] || 0,
    lockedUntil: row[6] || ""
  }));
}

function actionLogin(nome, senha) {
  try {
    if (!nome || !senha) {
      return { ok: false, error: "Preencha todos os campos" };
    }

    const users = getAllUsers();
    const u = users.find(user => user.nome.toLowerCase() === nome.toLowerCase());
    
    if (!u) {
      auditLog(nome, "LOGIN_FAILED", {reason: "user_not_found"});
      return { ok: false, error: "Usuário ou senha incorretos" };
    }

    // Verificar se conta está bloqueada
    if (u.lockedUntil) {
      const lockTime = new Date(u.lockedUntil);
      if (lockTime > new Date()) {
        const minutesLeft = Math.ceil((lockTime - new Date()) / 60000);
        auditLog(nome, "LOGIN_BLOCKED", {minutesLeft});
        return { 
          ok: false, 
          error: `Conta bloqueada temporariamente. Tente novamente em ${minutesLeft} minutos.` 
        };
      }
    }

    // Verificar senha
    const passwordHash = hashPassword(senha);
    if (u.senhaHash !== passwordHash) {
      // Incrementar tentativas
      const newAttempts = (u.loginAttempts || 0) + 1;
      const sheet = getUserSheet();
      sheet.getRange(u._row, 6).setValue(newAttempts);
      
      // Bloquear se exceder limite
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION).toISOString();
        sheet.getRange(u._row, 7).setValue(lockUntil);
        auditLog(nome, "ACCOUNT_LOCKED", {attempts: newAttempts});
        return { 
          ok: false, 
          error: "Muitas tentativas incorretas. Conta bloqueada por 15 minutos." 
        };
      }
      
      auditLog(nome, "LOGIN_FAILED", {reason: "wrong_password", attempts: newAttempts});
      return { 
        ok: false, 
        error: `Senha incorreta. ${MAX_LOGIN_ATTEMPTS - newAttempts} tentativas restantes.` 
      };
    }

    // Verificar status
    if (u.status === "bloqueado") {
      auditLog(nome, "LOGIN_FAILED", {reason: "account_blocked"});
      return { ok: false, error: "Conta bloqueada. Contate o administrador." };
    }

    // Login bem-sucedido - resetar tentativas
    const sheet = getUserSheet();
    sheet.getRange(u._row, 6).setValue(0);
    sheet.getRange(u._row, 7).setValue("");

    // Criar sessão
    const session = createSession(u.nome, u.role);
    
    auditLog(nome, "LOGIN_SUCCESS", {role: u.role});
    
    return { 
      ok: true, 
      session: {
        token: session.token,
        nome: session.nome,
        role: session.role,
        expiresAt: session.expiresAt
      }
    };
  } catch (err) {
    logError("actionLogin", err);
    return { ok: false, error: "Erro ao fazer login" };
  }
}

function actionLogout(token) {
  invalidateSession(token);
  return { ok: true };
}

const ACCESS_CODE = "Tomadas11145";

function actionRegister(nome, senha, inviteCode) {
  try {
    if (!nome || !senha || !inviteCode) {
      return { ok: false, error: "Preencha todos os campos" };
    }

    if (nome.length < 3) {
      return { ok: false, error: "Nome deve ter pelo menos 3 caracteres" };
    }

    if (senha.length < 4) {
      return { ok: false, error: "Senha deve ter pelo menos 4 caracteres" };
    }

    // Validar código de acesso fixo
    if (inviteCode !== ACCESS_CODE) {
      auditLog(nome, "REGISTER_FAILED", {reason: "invalid_access_code"});
      return { ok: false, error: "Código de acesso inválido" };
    }

    // Verificar se nome já existe
    const users = getAllUsers();
    if (users.find(u => u.nome.toLowerCase() === nome.toLowerCase())) {
      auditLog(nome, "REGISTER_FAILED", {reason: "name_exists"});
      return { ok: false, error: "Este nome já está em uso" };
    }

    // Criar usuário
    const userSheet = getUserSheet();
    const sanitizedNome = sanitizeString(nome, 50);
    const passwordHash = hashPassword(senha);

    userSheet.appendRow([
      sanitizedNome,
      passwordHash,
      "operator",
      new Date().toISOString(),
      "ativo",
      0,
      ""
    ]);

    auditLog(sanitizedNome, "REGISTER_SUCCESS", {});
    
    // Criar sessão automaticamente
    const session = createSession(sanitizedNome, "operator");
    
    return { 
      ok: true, 
      session: {
        token: session.token,
        nome: session.nome,
        role: session.role,
        expiresAt: session.expiresAt
      }
    };
  } catch (err) {
    logError("actionRegister", err);
    return { ok: false, error: "Erro ao criar conta" };
  }
}

// ══════════════════════════════════════════════════════════════
// ADMIN FUNCTIONS
// ══════════════════════════════════════════════════════════════

function actionGenerateInviteCode(token) {
  const session = validateSession(token);
  if(!session || session.role !== "admin") {
    auditLog(session?.nome || "UNKNOWN", "UNAUTHORIZED_INVITE_GEN", {});
    return { ok: false, error: "Acesso negado" };
  }
  
  const code = generateInviteCode();
  const sheet = getInviteCodesSheet();
  
  sheet.appendRow([
    code,
    session.nome,
    new Date().toISOString(),
    "", // usedBy
    "", // usedAt
    "ativo"
  ]);
  
  auditLog(session.nome, "INVITE_CODE_GENERATED", {code});
  
  return { ok: true, code };
}

function actionListInviteCodes(token) {
  const session = validateSession(token);
  if(!session || session.role !== "admin") {
    return { ok: false, error: "Acesso negado" };
  }
  
  const sheet = getInviteCodesSheet();
  const data = sheet.getDataRange().getValues();
  
  const codes = data.slice(1).map(row => ({
    code: row[0],
    createdBy: row[1],
    createdAt: row[2],
    usedBy: row[3],
    usedAt: row[4],
    status: row[5]
  }));
  
  return { ok: true, codes };
}

function actionListUsers(token) {
  const session = validateSession(token);
  if(!session || session.role !== "admin") {
    return { ok: false, error: "Acesso negado" };
  }
  
  const users = getAllUsers().map(u => ({
    nome: u.nome,
    role: u.role,
    criadoEm: u.criadoEm,
    status: u.status
  }));
  
  return { ok: true, users };
}

function actionToggleUser(token, targetNome) {
  const session = validateSession(token);
  if(!session || session.role !== "admin") {
    return { ok: false, error: "Acesso negado" };
  }
  
  const users = getAllUsers();
  const u = users.find(user => user.nome.toLowerCase() === targetNome.toLowerCase());
  
  if (!u) return { ok: false, error: "Usuário não encontrado" };
  if (u.nome === ADMIN_USER) return { ok: false, error: "Não é possível bloquear o admin principal" };
  
  const newStatus = u.status === "ativo" ? "bloqueado" : "ativo";
  getUserSheet().getRange(u._row, 5).setValue(newStatus);
  
  auditLog(session.nome, "USER_TOGGLED", {target: targetNome, newStatus});
  
  return { ok: true, newStatus };
}

function actionResetPassword(token, targetNome, novaSenha) {
  const session = validateSession(token);
  if(!session || session.role !== "admin") {
    return { ok: false, error: "Acesso negado" };
  }
  
  if (!novaSenha || novaSenha.length < 8) {
    return { ok: false, error: "Senha deve ter pelo menos 8 caracteres" };
  }
  
  const users = getAllUsers();
  const u = users.find(user => user.nome.toLowerCase() === targetNome.toLowerCase());
  
  if (!u) return { ok: false, error: "Usuário não encontrado" };
  
  const newHash = hashPassword(novaSenha);
  getUserSheet().getRange(u._row, 2).setValue(newHash);
  
  auditLog(session.nome, "PASSWORD_RESET", {target: targetNome});
  
  return { ok: true };
}

function actionAdminCreateUser(token, nome, senha) {
  const session = validateSession(token);
  if (!session || session.role !== "admin") {
    return { ok: false, error: "Acesso negado" };
  }

  if (!nome || nome.trim().length < 3) {
    return { ok: false, error: "Nome deve ter pelo menos 3 caracteres" };
  }
  if (!senha || senha.length < 4) {
    return { ok: false, error: "Senha deve ter pelo menos 4 caracteres" };
  }

  const sanitizedNome = sanitizeString(nome.trim(), 50);
  const users = getAllUsers();
  if (users.find(u => u.nome.toLowerCase() === sanitizedNome.toLowerCase())) {
    return { ok: false, error: "Este nome já está em uso" };
  }

  getUserSheet().appendRow([
    sanitizedNome,
    hashPassword(senha),
    "operator",
    new Date().toISOString(),
    "ativo",
    0,
    ""
  ]);

  auditLog(session.nome, "USER_CREATED_BY_ADMIN", { nome: sanitizedNome });
  return { ok: true };
}

// ══════════════════════════════════════════════════════════════
// DATA OPERATIONS
// ══════════════════════════════════════════════════════════════

function actionGetAll(token) {
  const session = validateSession(token);
  if(!session) {
    return { ok: false, error: "Sessão inválida ou expirada. Faça login novamente." };
  }
  
  try {
    const sheet = getProdSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return { ok: true, data: [] };

    const data = sheet.getRange(2, 1, lastRow - 1, PROD_HEADERS.length).getValues();
    
    const records = data.map(row => {
      const obj = {};
      PROD_HEADERS.forEach((header, i) => {
        const value = row[i];
        
        if (value === null || value === undefined || value === "") {
          obj[header] = "";
          return;
        }
        
        // Converter Date para ISO
        if (header === "date" && value instanceof Date) {
          const year = value.getFullYear();
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const day = String(value.getDate()).padStart(2, '0');
          obj[header] = `${year}-${month}-${day}`;
          return;
        }
        
        obj[header] = String(value).trim();
      });
      return obj;
    }).filter(r => r.machineId !== "" && r.date !== "");
    
    return { ok: true, data: records };
    
  } catch (err) {
    logError("actionGetAll", err);
    return { ok: false, error: "Erro ao carregar dados" };
  }
}

function actionUpsert(token, records) {
  const session = validateSession(token);
  if(!session) {
    return { ok: false, error: "Sessão inválida ou expirada" };
  }
  
  try {
    if (!records || records.length === 0) {
      return { ok: false, error: "Nenhum registro fornecido" };
    }
    
    const sheet = getProdSheet();
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const colIdx = {};
    headers.forEach((h, i) => colIdx[String(h).trim()] = i);
    
    records.forEach((rec, idx) => {
      // Validações
      if (!rec.date || !rec.turno || !rec.machineId) {
        Logger.log(`[UPSERT] Registro ${idx} ignorado - campos obrigatórios ausentes`);
        return;
      }
      
      // Validar turno
      if(!VALID_TURNOS.includes(rec.turno)) {
        throw new Error(`Turno inválido: ${rec.turno}`);
      }
      
      // Sanitizar e validar
      const sanitizedData = {
        date: rec.date, // Já vem em formato ISO
        turno: rec.turno,
        machineId: sanitizeNumber(rec.machineId, 1, 100),
        machineName: sanitizeString(rec.machineName, 100),
        meta: sanitizeNumber(rec.meta, 0, 10000),
        producao: sanitizeNumber(rec.producao, 0, 100000),
        savedBy: sanitizeString(rec.savedBy, 50),
        savedAt: sanitizeString(rec.savedAt, 50),
        editUser: sanitizeString(rec.editUser, 50),
        editTime: sanitizeString(rec.editTime, 50),
        // obs: undefined significa "não fornecido — preservar valor existente"
        obs: rec.obs !== undefined ? sanitizeString(rec.obs, 500) : undefined
      };
      
      // Procurar registro existente
      let foundRow = -1;
      for (let i = 1; i < allData.length; i++) {
        const rowDate = String(allData[i][colIdx["date"]] || "").trim();
        const rowTurno = String(allData[i][colIdx["turno"]] || "").trim();
        const rowMachId = String(allData[i][colIdx["machineId"]] || "").trim();
        
        if (rowDate === String(sanitizedData.date) && 
            rowTurno === String(sanitizedData.turno) && 
            rowMachId === String(sanitizedData.machineId)) {
          foundRow = i + 1;
          break;
        }
      }
      
      const rowData = PROD_HEADERS.map(header => {
        if (header === "id") {
          if (foundRow > 0) {
            return allData[foundRow - 1][colIdx["id"]] || Utilities.getUuid();
          }
          return Utilities.getUuid();
        }
        
        if (sanitizedData[header] !== undefined && sanitizedData[header] !== null) {
          return sanitizedData[header];
        }

        // Preserva campos do registro original quando não fornecidos na atualização
        if (foundRow > 0 && (header === "savedBy" || header === "savedAt" || header === "obs")) {
          const existingCol = colIdx[header];
          return existingCol !== undefined ? (allData[foundRow - 1][existingCol] || "") : "";
        }

        return "";
      });
      
      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, PROD_HEADERS.length).setValues([rowData]);
        auditLog(session.nome, "RECORD_UPDATED", {date: rec.date, turno: rec.turno, machineId: rec.machineId});
      } else {
        sheet.appendRow(rowData);
        auditLog(session.nome, "RECORD_CREATED", {date: rec.date, turno: rec.turno, machineId: rec.machineId});
      }
    });
    
    SpreadsheetApp.flush();
    return { ok: true, updated: records.length };
    
  } catch (err) {
    logError("actionUpsert", err);
    return { ok: false, error: err.message };
  }
}

function actionDelete(token, date, turno, machineId) {
  const session = validateSession(token);
  if(!session) {
    return { ok: false, error: "Sessão inválida ou expirada" };
  }
  
  try {
    if (!date || !turno || !machineId) {
      return { ok: false, error: "Parâmetros inválidos" };
    }
    
    const sheet = getProdSheet();
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const colIdx = {};
    headers.forEach((h, i) => colIdx[String(h).trim()] = i);
    
    let deleted = false;
    for (let i = allData.length - 1; i >= 1; i--) {
      const rowDate = String(allData[i][colIdx["date"]] || "").trim();
      const rowTurno = String(allData[i][colIdx["turno"]] || "").trim();
      const rowMachId = String(allData[i][colIdx["machineId"]] || "").trim();
      
      if (rowDate === String(date) && 
          rowTurno === String(turno) && 
          rowMachId === String(machineId)) {
        sheet.deleteRow(i + 1);
        deleted = true;
        auditLog(session.nome, "RECORD_DELETED", {date, turno, machineId});
        break;
      }
    }
    
    if (!deleted) {
      return { ok: false, error: "Registro não encontrado" };
    }
    
    SpreadsheetApp.flush();
    return { ok: true };
    
  } catch (err) {
    logError("actionDelete", err);
    return { ok: false, error: err.message };
  }
}