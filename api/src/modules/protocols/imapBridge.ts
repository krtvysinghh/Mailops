/**
 * Lightweight IMAP Bridge
 * 
 * Maps IMAP4rev1 (RFC 3501) commands to internal Mailops API calls.
 * This allows native mail clients to connect without needing a full IMAP server implementation.
 */

interface IMAPContext {
  userId: string;
  selectedBox: string | null;
  isAuthenticated: boolean;
}

interface IMAPCommand {
  tag: string;
  command: string;
  args: string[];
}

/**
 * Main parser and router for IMAP commands
 */
export async function translateIMAPCommand(line: string, context: IMAPContext): Promise<string[]> {
  const parts = parseCommand(line);
  if (!parts) return ['* BAD Invalid command format'];
  
  const { tag, command, args } = parts;
  const upperCommand = command.toUpperCase();
  
  try {
    switch (upperCommand) {
      case 'CAPABILITY':
        return [
          '* CAPABILITY IMAP4rev1 IDLE NAMESPACE CHILDREN UIDPLUS',
          `${tag} OK CAPABILITY completed`
        ];
        
      case 'LOGIN':
        if (args.length < 2) return [`${tag} BAD Missing arguments`];
        const [user, pass] = args;
        // Authenticate...
        context.userId = user; // Simplified
        context.isAuthenticated = true;
        return [`${tag} OK LOGIN completed`];
        
      case 'LOGOUT':
        context.isAuthenticated = false;
        return [
          '* BYE Logging out',
          `${tag} OK LOGOUT completed`
        ];
        
      case 'LIST':
        return handleLIST(tag, args, context);
        
      case 'SELECT':
        return handleSELECT(tag, args, context);
        
      case 'FETCH':
        return await handleFETCH(tag, args, context);
        
      case 'SEARCH':
        return await handleSEARCH(tag, args, context);
        
      case 'STORE':
        return await handleSTORE(tag, args, context);
        
      case 'UID':
        // Handle UID FETCH, UID SEARCH, UID STORE
        if (args.length === 0) return [`${tag} BAD Missing sub-command`];
        const subCommand = args[0].toUpperCase();
        const subArgs = args.slice(1);
        
        if (subCommand === 'FETCH') return await handleFETCH(tag, subArgs, context, true);
        if (subCommand === 'SEARCH') return await handleSEARCH(tag, subArgs, context, true);
        if (subCommand === 'STORE') return await handleSTORE(tag, subArgs, context, true);
        
        return [`${tag} BAD Unknown UID sub-command`];
        
      case 'NOOP':
        return [`${tag} OK NOOP completed`];
        
      default:
        return [`${tag} BAD Unknown command`];
    }
  } catch (err: any) {
    return [`${tag} NO Server error: ${err.message}`];
  }
}

function parseCommand(line: string): IMAPCommand | null {
  line = line.trim();
  if (!line) return null;
  
  // Basic tokenization (doesn't handle all IMAP string quoting rules properly)
  const tokens = [];
  let currentToken = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ' ' && !inQuotes) {
      if (currentToken) tokens.push(currentToken);
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  
  if (currentToken) tokens.push(currentToken);
  if (tokens.length < 2) return null;
  
  return {
    tag: tokens[0],
    command: tokens[1],
    args: tokens.slice(2)
  };
}

// ---------------------------------------------------------
// Command Handlers
// ---------------------------------------------------------

function handleLIST(tag: string, args: string[], context: IMAPContext): string[] {
  if (!context.isAuthenticated) return [`${tag} NO Not authenticated`];
  
  const responses = [
    '* LIST (\\HasNoChildren) "/" "INBOX"',
    '* LIST (\\HasNoChildren \\Sent) "/" "Sent"',
    '* LIST (\\HasNoChildren \\Drafts) "/" "Drafts"',
    '* LIST (\\HasNoChildren \\Trash) "/" "Trash"',
    `${tag} OK LIST completed`
  ];
  return responses;
}

function handleSELECT(tag: string, args: string[], context: IMAPContext): string[] {
  if (!context.isAuthenticated) return [`${tag} NO Not authenticated`];
  if (args.length < 1) return [`${tag} BAD Missing mailbox name`];
  
  const mailbox = args[0].replace(/"/g, '');
  context.selectedBox = mailbox;
  
  return [
    '* 100 EXISTS', // Mock counts
    '* 5 RECENT',
    '* OK [UNSEEN 10] Message 10 is first unseen',
    '* OK [UIDVALIDITY 123456] UIDs valid',
    '* OK [UIDNEXT 1001] Predicted next UID',
    '* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)',
    '* OK [PERMANENTFLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft \\*)] Limited',
    `${tag} OK [READ-WRITE] SELECT completed`
  ];
}

async function handleFETCH(tag: string, args: string[], context: IMAPContext, isUid = false): Promise<string[]> {
  if (!context.selectedBox) return [`${tag} NO No mailbox selected`];
  if (args.length < 2) return [`${tag} BAD Missing arguments`];
  
  const sequenceSet = args[0];
  const items = args[1].toUpperCase();
  
  const responses: string[] = [];
  
  // Mock logic - return a fake message for sequence 1
  if (sequenceSet === '1' || sequenceSet.startsWith('1:')) {
    let fetchLine = '* 1 FETCH (';
    
    if (isUid) fetchLine += 'UID 1000 ';
    
    if (items.includes('FLAGS')) {
      fetchLine += 'FLAGS (\\Seen) ';
    }
    
    if (items.includes('INTERNALDATE')) {
      fetchLine += 'INTERNALDATE "17-Jul-2023 10:00:00 +0000" ';
    }
    
    if (items.includes('RFC822.SIZE')) {
      fetchLine += 'RFC822.SIZE 1024 ';
    }
    
    if (items.includes('ENVELOPE')) {
      fetchLine += 'ENVELOPE ("Mon, 17 Jul 2023 10:00:00 +0000" "Test" (("Sender" NIL "sender" "example.com")) (("Sender" NIL "sender" "example.com")) (("Sender" NIL "sender" "example.com")) (("To" NIL "to" "example.com")) NIL NIL NIL "<msg-1@example.com>") ';
    }
    
    fetchLine = fetchLine.trim() + ')';
    responses.push(fetchLine);
  }
  
  responses.push(`${tag} OK FETCH completed`);
  return responses;
}

async function handleSEARCH(tag: string, args: string[], context: IMAPContext, isUid = false): Promise<string[]> {
  if (!context.selectedBox) return [`${tag} NO No mailbox selected`];
  
  // Mock search result - always return messages 1 and 2
  const prefix = isUid ? '* SEARCH 1000 1001' : '* SEARCH 1 2';
  
  return [
    prefix,
    `${tag} OK SEARCH completed`
  ];
}

async function handleSTORE(tag: string, args: string[], context: IMAPContext, isUid = false): Promise<string[]> {
  if (!context.selectedBox) return [`${tag} NO No mailbox selected`];
  if (args.length < 3) return [`${tag} BAD Missing arguments`];
  
  const sequenceSet = args[0];
  const operation = args[1].toUpperCase(); // +FLAGS, -FLAGS, FLAGS
  const flags = args[2];
  
  // Mock applying flags to message 1
  const responses = [];
  if (sequenceSet === '1' || sequenceSet.startsWith('1:')) {
    let response = `* 1 FETCH (FLAGS (${flags.replace(/[()]/g, '')})`;
    if (isUid) response += ' UID 1000';
    response += ')';
    responses.push(response);
  }
  
  responses.push(`${tag} OK STORE completed`);
  return responses;
}
