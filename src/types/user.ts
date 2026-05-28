export interface RootUserObject {
    user: User;
}

interface User {
    _id: string;
    login: string;
    login_changed: boolean;
    ip: string;
    rep: number;
    money: number;
    lycoin: number;
    vault_upgrades: string[];
    ram: number;
    cpu: number;
    net: number;
    firewall: number;
    encryptor: number;
    antivirus: number;
    locker: number;
    bypasser: number;
    cracker: number;
    miner: number;
    spyware: number;
    decompiler: number;
    tutorial_completed: boolean;
    rookie_attacks_used: number;
    isBanned: boolean;
    strikes: Strikes;
    referrals_count: number;
    bank_slots: BankSlot[];
    active_bank_boosts: any[];
    active_incidents: any[];
    counterstrike_tokens: CounterstrikeToken[];
    createdAt: string;
    exposure: number;
    crew: Crew;
    active_profile_id: string;
    idp_level: number;
    idp_charges: number;
    comeback_active_until: string;
    ftue_bonus_claimed: boolean;
    ftue_first_steal_amount: number;
    ftue_step: string;
    idp_enabled: boolean;
    rep_milestones_claimed: any[]; // у JSON порожній масив
    crew_leave_cooldown: string;
    sabotage_cooldowns: SabotageCooldown[];
    sabotage_protection: SabotageProtection;
    incident_cooldowns: IncidentCooldown[];
}

interface Strikes {
    count: number;
    _id: string;
}

interface BankSlot {
    id: number;
    amount: number;
    type: string;
    frozen: boolean;
    protected: boolean;
    locked: boolean;
}

interface CounterstrikeToken {
    target_id: string;
    target_ip: string;
    target_login: string;
    expires_at: string;
    _id: string;
}

interface Crew {
    crew_id: string;
    role: string;
    joined_at: string;
    _id: string;
    tag: string;
    name: string;
}

interface SabotageCooldown {
    victim_id: string;
    cooldown_until: string;
}

interface SabotageProtection {
    times_sabotaged_24h: number;
    last_sabotage_at: string;
    protection_until: string;
    resistance_until: string;
    sabotage_history: SabotageHistory[];
    _id: string;
}

interface SabotageHistory {
    attacker_id: string;
    count: number;
    last_sabotage_at: string;
}

interface IncidentCooldown {
    attacker_id: string;
    cooldown_until: string;
    _id: string;
}