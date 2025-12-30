import Time "mo:base/Time";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";


persistent actor DBank {

  // --- Types ---

  public type GoalType = { #Savings; #EMI };

  // --- Types V1 (Legacy) ---
  type TransactionV1 = {
    id : Text;
    op : Text;
    amount : Float;
    balance : Float;
    time : Int;
    memo : Text;
    ext : ?Text;
  };
  type GoalV1 = {
    id : Nat;
    name : Text;
    gType : GoalType;
    targetAmount : Float;
    currentAmount : Float;
    pendingInterest : Float;
    lastUpdate : Int;
    lockedUntil : Int;
    interestRate : Float;
    dueDate : Int;
    monthlyCommitment : Float;
    paidAmount : Float;
    ext : ?Text;
  };
  type CompletedGoalV1 = {
    name : Text;
    amount : Float;
    targetAmount : Float;
    paidAmount : Float;
    gType : GoalType;
    completionDate : Int;
  };
  type MigrationStateV1 = {
    currentValue : Float;
    pendingInterest : Float;
    txs : [TransactionV1];
    lastUpdateTimestamp : Int;
    lastCompoundTimestamp : Int;
    nextTxId : Nat;
    nextGoalId : Nat;
    goals : [GoalV1];
    completedGoals : [CompletedGoalV1];
    annualRate : Float;
  };

  // --- New Types (V2) ---
  public type GoalStatus = { #Active; #Paused; #Achieved; #Archived };
  
  public type Transaction = {
    id : Text;
    op : Text;
    amount : Float;
    balance : Float;
    time : Int;
    category : Text; // NEW
    tags : [Text];   // NEW
    memo : Text;
    ext : ?Text;
  };
  
  public type Goal = {
    id : Nat;
    name : Text;
    gType : GoalType;
    status : GoalStatus; // NEW
    category : Text;     // NEW
    priority : Nat;      // NEW
    targetAmount : Float;
    currentAmount : Float;
    pendingInterest : Float;
    lastUpdate : Int;
    lockedUntil : Int;
    interestRate : Float;
    dueDate : Int;
    monthlyCommitment : Float;
    paidAmount : Float;
    // EMI Enhancements
    nextDueDate : Int;   // NEW
    frequency : Int;     // NEW (Seconds)
    penaltyRate : Float; // NEW
    ext : ?Text;
  };

  public type Achievement = {
    id : Text;
    title : Text;
    icon : Text;
    description : Text;
    unlockedAt : ?Int;
  };

  public type CompletedGoal = {
    name : Text;
    amount : Float;
    targetAmount : Float;
    paidAmount : Float;
    gType : GoalType;
    completionDate : Int;
    category : Text; // NEW
  };

  // --- Investment System Types ---
  
  public type AssetType = {
    #Crypto;
    #Mineral;
    #Commodity;
    #MutualFund;
    #Currency;
  };

  public type AssetHolding = {
    assetType : AssetType;
    symbol : Text;              // BTC, Gold, USD, etc.
    amount : Float;             // Quantity held
    avgPurchasePrice : Float;   // Average price paid in Delta
    totalInvested : Float;      // Total Delta spent
    purchaseDate : Int;         // Timestamp
  };

  public type InvestmentWallet = {
    deltaBalance : Float;       // Delta tokens held
    holdings : [AssetHolding];  // Assets owned
  };

  // --- Types V2 (Old - Running State) ---
  type TransactionV2_Old = {
    id : Text;
    op : Text;
    amount : Float;
    balance : Float;
    time : Int;
    memo : Text;
    ext : ?Text;
  };

  type GoalV2_Old = {
    id : Nat;
    name : Text;
    gType : GoalType;
    targetAmount : Float;
    currentAmount : Float;
    pendingInterest : Float;
    lastUpdate : Int;
    lockedUntil : Int;
    interestRate : Float;
    dueDate : Int;
    monthlyCommitment : Float;
    paidAmount : Float;
    ext : ?Text;
  };

  type CompletedGoalV2_Old = {
    name : Text;
    amount : Float;
    targetAmount : Float;
    paidAmount : Float;
    gType : GoalType;
    completionDate : Int;
  };

  type MigrationStateV2 = {
    currentValue : Float;
    pendingInterest : Float;
    txsV3 : [TransactionV2_Old];
    lastUpdateTimestamp : Int;
    lastCompoundTimestamp : Int;
    nextTxId : Nat;
    nextGoalId : Nat;
    goalsV3 : [GoalV2_Old];
    completedGoalsV3 : [CompletedGoalV2_Old];
    annualRate : Float;
  };
  
  type MigrationStateV3 = {
    currentValue : Float;
    pendingInterest : Float;
    txsV3 : [Transaction];
    lastUpdateTimestamp : Int;
    lastCompoundTimestamp : Int;
    nextTxId : Nat;
    nextGoalId : Nat;
    goalsV3 : [Goal];
    completedGoalsV3 : [CompletedGoal];
    annualRate : Float;
  };

  // --- Persistent State ---

  stable var currentValue : Float = 0;
  stable var pendingInterest : Float = 0;
  stable var lastUpdateTimestamp : Int = Time.now();
  stable var lastCompoundTimestamp : Int = Time.now();
  stable var nextTxId : Nat = 0;
  stable var nextGoalId : Nat = 0;
  stable var annualRate : Float = -1.0;
  stable var compoundingIntervalNS : Int = 86_400_000_000_000;

  // Investment System State
  stable var investmentWallet : InvestmentWallet = {
    deltaBalance = 0.0;
    holdings = [];
  };

  // Legacy Stable Storage (Must keep for compatibility)
  stable var txs : [TransactionV2_Old] = [];
  stable var goals : [GoalV2_Old] = [];
  stable var completedGoals : [CompletedGoalV2_Old] = [];

  // New Logic State (Transient, populated from legacy on upgrade)
  transient var txsV3 : [Transaction] = [];
  transient var goalsV3 : [Goal] = [];
  transient var completedGoalsV3 : [CompletedGoal] = [];

  stable var upgradeBackup : ?MigrationStateV1 = null;
  stable var upgradeBackupV2 : ?MigrationStateV2 = null;
  stable var upgradeBackupV3 : ?MigrationStateV3 = null;



  // --- Migration Hooks ---

  system func preupgrade() {
    upgradeBackupV3 := ?{
      currentValue = currentValue;
      pendingInterest = pendingInterest;
      txsV3 = txsV3;
      lastUpdateTimestamp = lastUpdateTimestamp;
      lastCompoundTimestamp = lastCompoundTimestamp;
      nextTxId = nextTxId;
      nextGoalId = nextGoalId;
      goalsV3 = goalsV3;
      completedGoalsV3 = completedGoalsV3;
      annualRate = annualRate;
    };
  };

  system func postupgrade() {
    // Migration from V1 (Old)
    switch (upgradeBackup) {
      case (?data) {
        currentValue := data.currentValue;
        pendingInterest := data.pendingInterest;
        lastUpdateTimestamp := data.lastUpdateTimestamp;
        lastCompoundTimestamp := data.lastCompoundTimestamp;
        nextTxId := data.nextTxId;
        nextGoalId := data.nextGoalId;
        annualRate := data.annualRate;
        
        // Migrate Transactions
        txsV3 := Array.map<TransactionV1, Transaction>(data.txs, func(old) {
            {
                id = old.id; op = old.op; amount = old.amount; balance = old.balance;
                time = old.time; memo = old.memo; ext = old.ext;
                category = "General"; tags = [];
            }
        });

        // Migrate Goals
        goalsV3 := Array.map<GoalV1, Goal>(data.goals, func(old) {
            {
                id = old.id; name = old.name; gType = old.gType;
                targetAmount = old.targetAmount; currentAmount = old.currentAmount;
                pendingInterest = old.pendingInterest; lastUpdate = old.lastUpdate;
                lockedUntil = old.lockedUntil; interestRate = old.interestRate;
                dueDate = old.dueDate; monthlyCommitment = old.monthlyCommitment;
                paidAmount = old.paidAmount; ext = old.ext;
                // New Defaults
                status = #Active; category = "Savings"; priority = 1;
                nextDueDate = old.dueDate; frequency = 30 * 24 * 3600; penaltyRate = 0.0;
            }
        });

        // Migrate CompletedGoals
        completedGoalsV3 := Array.map<CompletedGoalV1, CompletedGoal>(data.completedGoals, func(old) {
            {
                name = old.name; amount = old.amount; targetAmount = old.targetAmount;
                paidAmount = old.paidAmount; gType = old.gType; completionDate = old.completionDate;
                category = "Savings";
            }
        });
      };
      case (null) {};
    };
    upgradeBackup := null;
    
    // Recovery from V2 (Old)
    switch(upgradeBackupV2) {
       case(?data) {
         currentValue := data.currentValue;
         pendingInterest := data.pendingInterest;
         lastUpdateTimestamp := data.lastUpdateTimestamp;
         lastCompoundTimestamp := data.lastCompoundTimestamp;
         nextTxId := data.nextTxId;
         nextGoalId := data.nextGoalId;
         annualRate := data.annualRate;
         
         // Migrate Txs V2 -> V3
         txsV3 := Array.map<TransactionV2_Old, Transaction>(data.txsV3, func(old) {
            {
                id = old.id; op = old.op; amount = old.amount; balance = old.balance;
                time = old.time; memo = old.memo; ext = old.ext;
                category = "General"; tags = [];
            }
         });

         // Migrate Goals V2 -> V3
         goalsV3 := Array.map<GoalV2_Old, Goal>(data.goalsV3, func(old) {
            {
                id = old.id; name = old.name; gType = old.gType;
                targetAmount = old.targetAmount; currentAmount = old.currentAmount;
                pendingInterest = old.pendingInterest; lastUpdate = old.lastUpdate;
                lockedUntil = old.lockedUntil; interestRate = old.interestRate;
                dueDate = old.dueDate; monthlyCommitment = old.monthlyCommitment;
                paidAmount = old.paidAmount; ext = old.ext;
                status = #Active; category = "Savings"; priority = 1;
                nextDueDate = old.dueDate; frequency = 30 * 24 * 3600; penaltyRate = 0.0;
            }
         });

         // Migrate CompletedGoals V2 -> V3
         completedGoalsV3 := Array.map<CompletedGoalV2_Old, CompletedGoal>(data.completedGoalsV3, func(old) {
             {
                 name = old.name; amount = old.amount; targetAmount = old.targetAmount;
                 paidAmount = old.paidAmount; gType = old.gType; completionDate = old.completionDate;
                 category = "Savings";
             }
         });
       };
       case(null) {};
    };
    upgradeBackupV2 := null;
    
    // Recovery from V3
    switch(upgradeBackupV3) {
       case(?data) {
         currentValue := data.currentValue;
         pendingInterest := data.pendingInterest;
         txsV3 := data.txsV3;
         lastUpdateTimestamp := data.lastUpdateTimestamp;
         lastCompoundTimestamp := data.lastCompoundTimestamp;
         nextTxId := data.nextTxId;
         nextGoalId := data.nextGoalId;
         goalsV3 := data.goalsV3;
         completedGoalsV3 := data.completedGoalsV3;
         annualRate := data.annualRate;
       };
       case(null) {};
    };
    upgradeBackupV3 := null;
  };

  // --- Internal Helper Logic ---

  private func getRate(balance : Float) : Float {
    if (annualRate >= 0.0) { return annualRate; };
    if (balance < 10_000.0) return 0.03;
    if (balance < 100_000.0) return 0.05;
    return 0.07;
  };

  private func _getLiveBalance() : Float {
    let rate : Float = getRate(currentValue);
    let currentTime = Time.now();
    let timeSinceLastUpdate = currentTime - lastUpdateTimestamp;
    if (timeSinceLastUpdate <= 0) { return currentValue + pendingInterest; };
    let secondsPerYear : Int = 31536000;
    let timeYears : Float = Float.fromInt(timeSinceLastUpdate) / 1_000_000_000.0 / Float.fromInt(secondsPerYear);
    let extraGrowth = currentValue * (Float.exp(rate * timeYears) - 1.0);
    return currentValue + pendingInterest + extraGrowth;
  };

  private func _updateGoalStatus(goalId : Nat, newStatus : GoalStatus) : Bool {
    var success = false;
    // We must use tabulate to update the immutable array
    goalsV3 := Array.tabulate<Goal>(goalsV3.size(), func(i) {
       let g = goalsV3[i];
       if (g.id == goalId) {
         success := true;
         return {
           id = g.id; name = g.name; gType = g.gType; targetAmount = g.targetAmount;
           currentAmount = g.currentAmount; pendingInterest = g.pendingInterest;
           lastUpdate = g.lastUpdate; lockedUntil = g.lockedUntil; interestRate = g.interestRate;
           dueDate = g.dueDate; monthlyCommitment = g.monthlyCommitment; 
           paidAmount = g.paidAmount; 
           status = newStatus; // Updated
           category = g.category; priority = g.priority;
           nextDueDate = g.nextDueDate; frequency = g.frequency; penaltyRate = g.penaltyRate;
           ext = g.ext;
         };
       } else { return g; };
    });
    return success;
  };

  private func _recordTransaction(op : Text, amount : Float, balance : Float, memo : Text, cat : Text, tgs : [Text]) : () {
    let entry : Transaction = {
      id = "TX-" # Nat.toText(nextTxId) # "-" # Nat.toText(Int.abs(Time.now()));
      op = op;
      amount = amount;
      balance = balance;
      time = Time.now();
      category = cat;
      tags = tgs;
      memo = memo;
      ext = null;
    };
    nextTxId += 1;
    txsV3 := Array.append([entry], txsV3);
  };

  private func _realizeGains() {
    let now = Time.now();
    let rate : Float = getRate(currentValue);
    let timeSinceLastUpdate = now - lastUpdateTimestamp;

    var actualGoals = goalsV3;

    if (timeSinceLastUpdate > 0) {
      let secondsPerYear : Int = 31536000;
      let timeYears : Float = Float.fromInt(timeSinceLastUpdate) / 1_000_000_000.0 / Float.fromInt(secondsPerYear);
      
      pendingInterest += currentValue * (Float.exp(rate * timeYears) - 1.0);

      // Accrue for savings goalsV3
      actualGoals := Array.tabulate<Goal>(actualGoals.size(), func(idx) {
        let og = actualGoals[idx];
        switch (og.gType) {
          case (#Savings) {
            if (og.currentAmount > 0) {
              let goalGrowth = og.currentAmount * (Float.exp(og.interestRate * timeYears) - 1.0);
              return {
                id = og.id; name = og.name; gType = og.gType; targetAmount = og.targetAmount;
                currentAmount = og.currentAmount; pendingInterest = og.pendingInterest + goalGrowth;
                lastUpdate = now; lockedUntil = og.lockedUntil; interestRate = og.interestRate;
                dueDate = og.dueDate; monthlyCommitment = og.monthlyCommitment; 
                paidAmount = og.paidAmount; 
                status = og.status; category = og.category; priority = og.priority;
                nextDueDate = og.nextDueDate; frequency = og.frequency; penaltyRate = og.penaltyRate;
                ext = og.ext;
              };
            } else { return og; };
          };
          case (#EMI) { return og; }; // EMIs don't accrue interest in this model
        }
      });
      lastUpdateTimestamp := now;
    };

    if (now - lastCompoundTimestamp >= 86_400_000_000_000) {
      if (pendingInterest > 0.000001) {
        currentValue += pendingInterest;
        _recordTransaction("compound", pendingInterest, currentValue, "", "Interest", ["System"]);
        pendingInterest := 0;
      };

      // Compounding for goalsV3
      actualGoals := Array.tabulate<Goal>(actualGoals.size(), func(idx) {
        let og = actualGoals[idx];
        if (og.pendingInterest > 0.000001) {
          return {
            id = og.id; name = og.name; gType = og.gType; targetAmount = og.targetAmount;
            currentAmount = og.currentAmount + og.pendingInterest; pendingInterest = 0;
            lastUpdate = og.lastUpdate; lockedUntil = og.lockedUntil; interestRate = og.interestRate;
            dueDate = og.dueDate; monthlyCommitment = og.monthlyCommitment; 
            paidAmount = og.paidAmount; 
            status = og.status; category = og.category; priority = og.priority;
            nextDueDate = og.nextDueDate; frequency = og.frequency; penaltyRate = og.penaltyRate;
            ext = og.ext;
          };
        } else { return og; };
      });
      lastCompoundTimestamp := now;
    };
    goalsV3 := actualGoals;
  };

  // --- Public Methods ---

  public query func exportTransactionsCSV() : async Text {
    let header = "ID,Operation,Amount,Balance,Time,Category,Tags,Memo,Ext\n";
    let b = Buffer.Buffer<Text>(100);
    b.add(header);
    
    for (t in txsV3.vals()) {
      let tagsStr = Text.join(";", Iter.fromArray(t.tags));
      let line = t.id # "," # 
                 t.op # "," # 
                 Float.toText(t.amount) # "," # 
                 Float.toText(t.balance) # "," # 
                 Int.toText(t.time) # "," # 
                 t.category # "," #
                 tagsStr # "," #
                 "\"" # t.memo # "\"" # "," # 
                 (switch(t.ext) { case(null) ""; case(?v) v }) # "\n";
      b.add(line);
    };
    
    return Text.join("", Iter.fromArray(Buffer.toArray(b)));
  };

  public query func getCurrentValue() : async Float { return _getLiveBalance(); };
  public query func getTransactions() : async [Transaction] { return txsV3; };

  public func deposit(amount : Float) : async Float {
    _realizeGains();
    currentValue += amount;
    _recordTransaction("deposit", amount, currentValue, "", "Income", ["Deposit"]);
    return currentValue;
  };

  public func withdraw(amount : Float) : async ?Float {
    _realizeGains();
    if (currentValue >= amount) {
      currentValue -= amount;
      _recordTransaction("withdraw", amount, currentValue, "", "Expense", ["Withdrawal"]);
      return ?currentValue;
    } else { return null; };
  };

  public func closeGoal(goalId : Nat) : async ?Float {
    _realizeGains();
    var foundIdx : ?Nat = null;
    var i = 0;
    while (i < goalsV3.size()) {
        if (goalsV3[i].id == goalId) { foundIdx := ?i; i := goalsV3.size(); } else { i += 1; };
    };

    switch (foundIdx) {
      case (?idx) {
        let g = goalsV3[idx];
        let totalRefund = g.currentAmount + g.pendingInterest;
        currentValue += totalRefund;
        _recordTransaction("goal_liquidate", totalRefund, currentValue, g.name, g.category, ["Goal", "Liquidate"]);
        
        let archiveEntry : CompletedGoal = {
          name = g.name;
          amount = totalRefund;
          targetAmount = g.targetAmount;
          paidAmount = g.paidAmount;
          gType = g.gType;
          completionDate = Time.now();
          category = g.category;
        };
        completedGoalsV3 := Array.append(completedGoalsV3, [archiveEntry]);

        if (goalsV3.size() == 1) {
            goalsV3 := [];
        } else {
            goalsV3 := Array.tabulate<Goal>(goalsV3.size() - 1, func(j) {
                if (j < idx) { goalsV3[j] } else { goalsV3[j+1] }
            });
        };
        return ?currentValue;
      };
      case (null) return null;
    };
  };

  public func deleteGoal(goalId : Nat) : async Bool {
    var foundIdx : ?Nat = null;
    var i = 0;
    while (i < goalsV3.size()) {
        if (goalsV3[i].id == goalId) { foundIdx := ?i; i := goalsV3.size(); } else { i += 1; };
    };

    switch (foundIdx) {
      case (?idx) {
        let g = goalsV3[idx];
        if (g.currentAmount == 0.0) {
            
            // ARCHIVE BEFORE DELETE (Preserve History)
            let archiveEntry : CompletedGoal = {
              name = g.name;
              amount = g.paidAmount; // For history, track what was paid/accumulated
              targetAmount = g.targetAmount;
              paidAmount = g.paidAmount;
              gType = g.gType;
              completionDate = Time.now();
              category = g.category;
            };
            completedGoalsV3 := Array.append(completedGoalsV3, [archiveEntry]);

            if (goalsV3.size() == 1) {
                goalsV3 := [];
            } else {
                goalsV3 := Array.tabulate<Goal>(goalsV3.size() - 1, func(j) {
                    if (j < idx) { goalsV3[j] } else { goalsV3[j+1] }
                });
            };
            return true;
        } else {
            return false;
        };
      };
      case (null) return false;
    };
  };

  public func fundGoal(goalId : Nat, amount : Float) : async ?Float {
    _realizeGains();
    if (currentValue < amount) return null;
    var success = false;
    var goalName = "";
    let oldGoals = goalsV3;
    goalsV3 := Array.tabulate<Goal>(oldGoals.size(), func(i) {
      let og = oldGoals[i];
      if (og.id == goalId) {
        success := true;
        goalName := og.name;
        currentValue -= amount;
        return {
          id = og.id; name = og.name; gType = og.gType; targetAmount = og.targetAmount;
          currentAmount = og.currentAmount + amount; pendingInterest = og.pendingInterest;
          lastUpdate = Time.now(); lockedUntil = og.lockedUntil; interestRate = og.interestRate;
          dueDate = og.dueDate; monthlyCommitment = og.monthlyCommitment; 
          paidAmount = switch(og.gType) {
            case (#Savings) og.paidAmount + amount;
            case (#EMI) og.paidAmount; 
          }; // Track lifetime contribution only for Savings, EMI tracks on payment 
          status = og.status; category = og.category; priority = og.priority;
          nextDueDate = og.nextDueDate; frequency = og.frequency; penaltyRate = og.penaltyRate;
          ext = og.ext;
        };
      } else { return og; };
    });
    if (success) {
      // Determine Op based on Type: 'goal_fund' vs 'emi_fund'
      // We look up the Goal Type first (we have to find it again or capture it in loop)
      // Optimization: Captured in `oldGoals` scan, but `goalsV3 := tabulate` makes it tricky to extract cleanly without re-looping or var.
      // Since we just updated `goalsV3`, let's find the type.
      // Or simpler: tabulate loop is fast, but we can't extract easily.
      // Let's rely on finding it again or just look at `goalId` properties if stored? No.
      // Let's re-find to be safe and clean, overhead is minimal for small N.
      var isEMI = false;
      var k = 0;
      while (k < goalsV3.size()) {
        if (goalsV3[k].id == goalId) {
             switch(goalsV3[k].gType){ case(#EMI){ isEMI := true; }; case(_){}; };
             k := goalsV3.size();
        } else { k += 1; };
      };
      
      let op = if (isEMI) "emi_fund" else "goal_fund";
      
      // Look up category for recording
      var cat = "Savings";
      var j = 0;
      while (j < goalsV3.size()) { if (goalsV3[j].id == goalId) { cat := goalsV3[j].category; j := goalsV3.size(); } else { j += 1; } };

      _recordTransaction(op, amount, currentValue, goalName, cat, ["Fund"]);
      return ?currentValue;
    } else { return null; };
  };

  public func withdrawFromGoal(goalId : Nat, amount : Float) : async ?Float {
    _realizeGains();
    var success = false;
    var goalName = "";
    let now = Time.now();
    let oldGoals = goalsV3;
    goalsV3 := Array.tabulate<Goal>(oldGoals.size(), func(i) {
      let g = oldGoals[i];
      // Allow withdrawal from both Savings (general) and EMI (the buffer)
      if (g.id == goalId and g.currentAmount >= amount and now >= g.lockedUntil) {
            success := true;
            goalName := g.name;
            currentValue += amount;
            return {
              id = g.id; name = g.name; gType = g.gType; targetAmount = g.targetAmount;
              currentAmount = g.currentAmount - amount; pendingInterest = g.pendingInterest;
              lastUpdate = g.lastUpdate; lockedUntil = g.lockedUntil; interestRate = g.interestRate;
              dueDate = g.dueDate; monthlyCommitment = g.monthlyCommitment; 
              paidAmount = g.paidAmount; 
              status = g.status; category = g.category; priority = g.priority;
              nextDueDate = g.nextDueDate; frequency = g.frequency; penaltyRate = g.penaltyRate;
              ext = g.ext;
            };
      } else { return g; };
    });
    if (success) {
      // Determine Op
      var isEMI = false;
      var k = 0;
      while (k < goalsV3.size()) {
        if (goalsV3[k].id == goalId) {
             switch(goalsV3[k].gType){ case(#EMI){ isEMI := true; }; case(_){}; };
             k := goalsV3.size();
        } else { k += 1; };
      };
      let op = if (isEMI) "emi_withdraw" else "goal_withdraw";
      
      var cat = "Savings";
      var j = 0;
      while (j < goalsV3.size()) { if (goalsV3[j].id == goalId) { cat := goalsV3[j].category; j := goalsV3.size(); } else { j += 1; } };

      _recordTransaction(op, amount, currentValue, goalName, cat, ["Withdraw"]);
      return ?currentValue;
    } else { return null; };
  };

  public func partialLiquidateGoal(goalId : Nat, amount : Float) : async ?Float {
    _realizeGains();
    var success = false;
    var goalName = "";
    let now = Time.now();
    let oldGoals = goalsV3;
    goalsV3 := Array.tabulate<Goal>(oldGoals.size(), func(i) {
      let g = oldGoals[i];
      if (g.id == goalId and g.currentAmount >= amount) {
            success := true;
            goalName := g.name;
            // Check Lock
            let isLocked = now < g.lockedUntil;
            let penalty = if (isLocked) amount * g.penaltyRate else 0.0;
            let creditAmount = amount - penalty;
            
            currentValue += creditAmount;
            
            // If penalty applied, record it?
            if (penalty > 0.0) {
               // Record penalty transaction or just let it vanish (bank profit)
               // For visibility, maybe separate record?
               // _recordTransaction("penalty", penalty, currentValue, "Early Withdrawal Penalty");
               // But inside tabulation we can't call async or mutate effectively other than currentValue.
               // We'll record it after loop.
            };

            return {
              id = g.id; name = g.name; gType = g.gType; targetAmount = g.targetAmount;
              currentAmount = g.currentAmount - amount; pendingInterest = g.pendingInterest;
              lastUpdate = g.lastUpdate; lockedUntil = g.lockedUntil; interestRate = g.interestRate;
              dueDate = g.dueDate; monthlyCommitment = g.monthlyCommitment; 
              paidAmount = g.paidAmount; 
              status = g.status; category = g.category; priority = g.priority;
              nextDueDate = g.nextDueDate; frequency = g.frequency; penaltyRate = g.penaltyRate;
              ext = g.ext;
            };
      } else { return g; };
    });
    
    if (success) {
      // Find category
      var cat = "Savings";
      var j = 0;
      while (j < goalsV3.size()) { if (goalsV3[j].id == goalId) { cat := goalsV3[j].category; j := goalsV3.size(); } else { j += 1; } };

      _recordTransaction("partial_liquidate", amount, currentValue, goalName, cat, ["Liquidate", "Partial"]);
      return ?currentValue;
    } else { return null; };
  };

  public func payEMI(goalId : Nat, amount : Float, fromGoalBalance : Bool) : async ?Float {
    _realizeGains();
    var success = false;
    var goalName = "";
    let oldGoals = goalsV3;
    goalsV3 := Array.tabulate<Goal>(oldGoals.size(), func(i) {
      let g = oldGoals[i];
      switch (g.gType) {
        case (#EMI) {
          if (g.id == goalId) {
            if (fromGoalBalance) {
               // Use funds already saved in the goal
               if (g.currentAmount >= amount) {
                 success := true;
                 goalName := g.name;
                 // currentValue doesn't change because it was already deducted when funding the goal
                 return {
                   id = g.id; name = g.name; gType = g.gType; targetAmount = g.targetAmount;
                   currentAmount = g.currentAmount - amount; // Bucket decreases
                   pendingInterest = g.pendingInterest;
                   lastUpdate = Time.now(); lockedUntil = g.lockedUntil; interestRate = g.interestRate;
                   dueDate = g.dueDate; monthlyCommitment = g.monthlyCommitment; 
                   paidAmount = g.paidAmount + amount; // Debt reduction increases
                   status = g.status; category = g.category; priority = g.priority;
                   nextDueDate = g.nextDueDate; frequency = g.frequency; penaltyRate = g.penaltyRate;
                   ext = g.ext;
                 };
               } else { return g; };
            } else {
               // Use funds from the main wallet
               if (currentValue >= amount) {
                 success := true;
                 goalName := g.name;
                 currentValue -= amount;
                 return {
                   id = g.id; name = g.name; gType = g.gType; targetAmount = g.targetAmount;
                   currentAmount = g.currentAmount; // Bucket stays same
                   pendingInterest = g.pendingInterest;
                   lastUpdate = Time.now(); lockedUntil = g.lockedUntil; interestRate = g.interestRate;
                   dueDate = g.dueDate; monthlyCommitment = g.monthlyCommitment; 
                   paidAmount = g.paidAmount + amount; // Debt reduction increases
                   status = g.status; category = g.category; priority = g.priority;
                   nextDueDate = g.nextDueDate; frequency = g.frequency; penaltyRate = g.penaltyRate;
                   ext = g.ext;
                 };
               } else { return g; };
            };
          };
          return g;
        };
        case (#Savings) { return g; };
      }
    });
    if (success) {
      let op = if (fromGoalBalance) "emi_payment_bucket" else "emi_payment_wallet";
      
      var cat = "Debt";
      var j = 0;
      while (j < goalsV3.size()) { if (goalsV3[j].id == goalId) { cat := goalsV3[j].category; j := goalsV3.size(); } else { j += 1; } };

      _recordTransaction(op, amount, currentValue, goalName, cat, ["EMI", "Payment"]);
      return ?currentValue;
    } else { return null; };
  };

  public func createGoal(name : Text, target : Float, lockSecs : Int, gType : GoalType, dueDate : Int, commitment : Float, initialFund : Float, autoPay : Bool) : async Nat {
    _realizeGains();
    let goalId = nextGoalId;
    nextGoalId += 1;

    let fundAmount = if (currentValue >= initialFund) initialFund else 0.0;
    currentValue -= fundAmount;

    let newGoal : Goal = {
      id = goalId; name = name; gType = gType; targetAmount = target;
      currentAmount = fundAmount; pendingInterest = 0.0; lastUpdate = Time.now();
      lockedUntil = Time.now() + (lockSecs * 1_000_000_000);
      interestRate = switch (gType) { case (#Savings) 0.08; case (#EMI) 0.0; };
      dueDate = dueDate; monthlyCommitment = commitment; paidAmount = fundAmount; ext = null;
      status = if (autoPay) #Active else #Paused; category = "Savings"; priority = 1;
      nextDueDate = dueDate; frequency = 30 * 24 * 3600; penaltyRate = 0.0;
    };
    goalsV3 := Array.append(goalsV3, [newGoal]);
    
    if (fundAmount > 0.0) {
      _recordTransaction(switch(gType){case(#Savings)"goal_create"; case(#EMI)"emi_setup"}, fundAmount, currentValue, name, "Savings", ["Create"]);
    };
    
    return goalId;
  };

  public func updateGoal(goalId : Nat, name : Text, target : Float, commitment : Float) : async Bool {
    var success = false;
    let oldGoals = goalsV3;
    goalsV3 := Array.tabulate<Goal>(oldGoals.size(), func(i) {
      let g = oldGoals[i];
      if (g.id == goalId) {
        success := true;
        return {
          id = g.id; name = name; gType = g.gType; targetAmount = target;
          currentAmount = g.currentAmount; pendingInterest = g.pendingInterest;
          lastUpdate = g.lastUpdate; lockedUntil = g.lockedUntil; interestRate = g.interestRate;
          dueDate = g.dueDate; monthlyCommitment = commitment; paidAmount = g.paidAmount; 
          status = g.status; category = g.category; priority = g.priority;
          nextDueDate = g.nextDueDate; frequency = g.frequency; penaltyRate = g.penaltyRate;
          ext = g.ext;
        };
      } else { return g; };
    });
    return success;
  };

  public func toggleGoalStatus(goalId : Nat, isActive : Bool) : async Bool {
    let newStatus : GoalStatus = if (isActive) #Active else #Paused;
    return _updateGoalStatus(goalId, newStatus);
  };

  public func debugMakeGoalDue(goalId : Nat) : async Bool {
    var success = false;
    let now = Time.now();
    let oldGoals = goalsV3;
    goalsV3 := Array.tabulate<Goal>(oldGoals.size(), func(i) {
        let g = oldGoals[i];
        if (g.id == goalId) {
            success := true;
            return {
                id = g.id; name = g.name; gType = g.gType; targetAmount = g.targetAmount;
                currentAmount = g.currentAmount; pendingInterest = g.pendingInterest;
                lastUpdate = g.lastUpdate; lockedUntil = g.lockedUntil; interestRate = g.interestRate;
                dueDate = g.dueDate; monthlyCommitment = g.monthlyCommitment; 
                paidAmount = g.paidAmount; 
                status = g.status; category = g.category; priority = g.priority;
                nextDueDate = now - 1; // Due in past
                frequency = g.frequency; penaltyRate = g.penaltyRate;
                ext = g.ext;
            };
        } else { return g; };
    });
    return success;
  };

  public query func getGoals() : async [Goal] { return goalsV3; };
  public query func getCompletedGoals() : async [CompletedGoal] { return completedGoalsV3; };

  private func _processRecurringTransfers() {
    let now = Time.now();
    var wallet = currentValue;
    var changes = false;
    
    // We use a local var for goals to avoid reading the changing global if we were replacing it,
    // but here we read the *current* global goalsV3 and build a *new* array.
    // The side effects (wallet update, tx recording) happen sequentially.
    
    let newGoals = Array.tabulate<Goal>(goalsV3.size(), func(i) {
        let g = goalsV3[i];
        
        // Conditions: Active, Has Commitment, Is Due
        // Note: We check if wallet has funds. If not, we SKIP this turn.
        // We do NOT advance the date if we skip?
        // Risk: If undefined, it keeps retrying every heartbeat.
        // Alternative: Advance date anyway (skip payment) OR Pause goal?
        // Let's Retry for now (don't advance date).
        
        let isDue = (switch(g.status){case(#Active) true; case(_) false;}) and (g.monthlyCommitment > 0.0) and (now >= g.nextDueDate);
        
        if (isDue) {
            if (wallet >= g.monthlyCommitment) {
                changes := true;
                wallet -= g.monthlyCommitment;
                
                // Determine Op
                let op = switch(g.gType) { case(#Savings) "auto_save"; case(#EMI) "auto_pay_emi"; };
                
                // Record
                _recordTransaction(op, g.monthlyCommitment, wallet, "Auto: " # g.name, "Automation", ["Auto"]);
                
                // Advance Date (add frequency in nanoseconds)
                let freqNS = g.frequency * 1_000_000_000;
                
                return {
                    id = g.id; name = g.name; gType = g.gType; targetAmount = g.targetAmount;
                    currentAmount = g.currentAmount + g.monthlyCommitment; // Fund the bucket
                    pendingInterest = g.pendingInterest;
                    lastUpdate = now; lockedUntil = g.lockedUntil; interestRate = g.interestRate;
                    dueDate = g.dueDate; monthlyCommitment = g.monthlyCommitment; 
                    paidAmount = g.paidAmount + g.monthlyCommitment; // Track lifetime contribution 
                    status = g.status; category = g.category; priority = g.priority;
                    nextDueDate = g.nextDueDate + freqNS; // Advance
                    frequency = g.frequency; penaltyRate = g.penaltyRate;
                    ext = g.ext;
                };
            } else {
                 // Insufficient funds: Skip, try again next heartbeat.
                 return g;
            };
        } else {
            return g;
        };
    });
    
    if (changes) {
        goalsV3 := newGoals;
        currentValue := wallet;
    };
  };

  system func heartbeat() : async () {
    let now = Time.now();
    
    // 1. Recurring Transfers
    _processRecurringTransfers();
    
    // 2. Interest Compounding
    if (now - lastCompoundTimestamp > 3600 * 1_000_000_000) { _realizeGains(); };
  };

  public query func projectedBalances(years : [Int]) : async [Float] {
    let p = _getLiveBalance();
    let rate = getRate(p);
    return Array.tabulate<Float>(Array.size(years), func(i) { p * Float.exp(rate * Float.fromInt(years[i])) });
  };

  public query func getFinancialHealth() : async Float {
    var score = 50.0;
    
    // 1. Balance Health (Max 30)
    let bal = _getLiveBalance();
    if (bal > 100_000.0) { score += 30.0; }
    else if (bal > 10_000.0) { score += 20.0; }
    else if (bal > 1_000.0) { score += 10.0; };
    
    // 2. Goal Achievement (Max 20)
    if (completedGoalsV3.size() >= 5) { score += 20.0; }
    else if (completedGoalsV3.size() >= 1) { score += 10.0; };
    
    // 3. Automation Usage (Max 20)
    var hasAuto = false;
    for (t in txsV3.vals()) {
        if (t.category == "Automation") { hasAuto := true; };
    };
    if (hasAuto) { score += 20.0; };
    
    // 4. Debt Management (Penalties)
    // If any EMI goal is "Active" but bucket < 1 month commitment (At Risk)
    for (g in goalsV3.vals()) {
        switch(g.gType) {
            case(#EMI) {
                if (g.currentAmount < g.monthlyCommitment) { score -= 5.0; };
            };
            case(_) {};
        };
    };

    if (score > 100.0) return 100.0;
    if (score < 0.0) return 0.0;
    return score;
  };

  public query func getAchievements() : async [Achievement] {
    var achievements : [Achievement] = [];
    
    // Helper to add
    func add(id: Text, title: Text, icon: Text, desc: Text, condition: Bool, date: ?Int) {
        achievements := Array.append(achievements, [{
            id = id; title = title; icon = icon; description = desc;
            unlockedAt = if (condition) date else null;
        }]);
    };
    
    let now = Time.now();
    let bal = _getLiveBalance();
    
    // Check History for Logic
    var hasDeposit = false;
    var hasWithdraw = false;
    var hasAuto = false;
    var firstTxTime : ?Int = null;
    
    for (t in txsV3.vals()) {
        if (firstTxTime == null) { firstTxTime := ?t.time; };
        if (t.op == "deposit") { hasDeposit := true; };
        if (t.op == "withdraw") { hasWithdraw := true; };
        if (t.category == "Automation") { hasAuto := true; };
    };

    var savingsGoalsCompleted = 0;
    var emiGoalsCompleted = 0;
    for (cg in completedGoalsV3.vals()) {
        switch(cg.gType) {
            case(#Savings) { savingsGoalsCompleted += 1; };
            case(#EMI) { emiGoalsCompleted += 1; };
        };
    };

    // Define Badges
    add("first_step", "First Step", "Footprints", "Make your first transaction.", txsV3.size() > 0, firstTxTime);
    add("saver", "Savvy Saver", "PiggyBank", "Complete a savings goal.", savingsGoalsCompleted > 0, if (savingsGoalsCompleted > 0) ?now else null); // Ideally finding exact time
    add("freedom", "Debt Destroyer", "Unlink", "Pay off a debt completely.", emiGoalsCompleted > 0, if (emiGoalsCompleted > 0) ?now else null);
    add("high_roller", "High Roller", "Diamond", "Reach a balance of ⨎10,000.", bal >= 10_000.0, ?now);
    add("automation", "On Autopilot", "Bot", "Execute an automated transaction.", hasAuto, ?now);
    add("whale", "The Whale", "Crown", "Reach a balance of ⨎100,000.", bal >= 100_000.0, ?now);

    return achievements;
  };

  // --- Investment System Functions ---

  // Token Conversion: 1 dBank = 10,000 Delta
  private let DELTA_CONVERSION_RATE : Float = 10_000.0;

  public func buyDeltaTokens(dbankAmount : Float) : async ?Float {
    _realizeGains();
    if (currentValue < dbankAmount) return null;
    
    currentValue -= dbankAmount;
    let deltaAmount = dbankAmount * DELTA_CONVERSION_RATE;
    
    investmentWallet := {
      deltaBalance = investmentWallet.deltaBalance + deltaAmount;
      holdings = investmentWallet.holdings;
    };
    
    _recordTransaction("buy_delta", dbankAmount, currentValue, Float.toText(deltaAmount) # " Δ", "Investment", ["Token", "Buy"]);
    return ?investmentWallet.deltaBalance;
  };

  public func sellDeltaTokens(deltaAmount : Float) : async ?Float {
    _realizeGains();
    if (investmentWallet.deltaBalance < deltaAmount) return null;
    
    let dbankAmount = deltaAmount / DELTA_CONVERSION_RATE;
    currentValue += dbankAmount;
    
    investmentWallet := {
      deltaBalance = investmentWallet.deltaBalance - deltaAmount;
      holdings = investmentWallet.holdings;
    };
    
    _recordTransaction("sell_delta", dbankAmount, currentValue, Float.toText(deltaAmount) # " Δ", "Investment", ["Token", "Sell"]);
    return ?currentValue;
  };

  public func buyAsset(assetType : AssetType, symbol : Text, deltaAmount : Float, currentPrice : Float) : async Bool {
    if (investmentWallet.deltaBalance < deltaAmount) return false;
    if (currentPrice <= 0.0) return false;
    
    // Calculate asset quantity
    // currentPrice is in INR, need to convert Delta to INR first
    let inrAmount = deltaAmount / DELTA_CONVERSION_RATE;
    let assetQuantity = inrAmount / currentPrice;
    
    // Check if we already hold this asset
    var existingHolding : ?AssetHolding = null;
    var otherHoldings : [AssetHolding] = [];
    
    for (holding in investmentWallet.holdings.vals()) {
      if (holding.symbol == symbol) {
        existingHolding := ?holding;
      } else {
        otherHoldings := Array.append(otherHoldings, [holding]);
      };
    };
    
    let newHolding : AssetHolding = switch (existingHolding) {
      case (?existing) {
        // Update existing holding with average price
        let totalAmount = existing.amount + assetQuantity;
        let totalInvested = existing.totalInvested + deltaAmount;
        {
          assetType = assetType;
          symbol = symbol;
          amount = totalAmount;
          avgPurchasePrice = totalInvested / totalAmount;
          totalInvested = totalInvested;
          purchaseDate = existing.purchaseDate;
        };
      };
      case (null) {
        // New holding
        {
          assetType = assetType;
          symbol = symbol;
          amount = assetQuantity;
          avgPurchasePrice = deltaAmount / assetQuantity;
          totalInvested = deltaAmount;
          purchaseDate = Time.now();
        };
      };
    };
    
    investmentWallet := {
      deltaBalance = investmentWallet.deltaBalance - deltaAmount;
      holdings = Array.append(otherHoldings, [newHolding]);
    };
    
    _recordTransaction("buy_asset", deltaAmount / DELTA_CONVERSION_RATE, currentValue, symbol, "Investment", ["Asset", "Buy"]);
    return true;
  };

  public func sellAsset(assetType : AssetType, symbol : Text, assetAmount : Float, currentPrice : Float) : async ?Float {
    if (currentPrice <= 0.0) return null;
    
    // Find the asset
    var foundHolding : ?AssetHolding = null;
    var otherHoldings : [AssetHolding] = [];
    
    for (holding in investmentWallet.holdings.vals()) {
      if (holding.symbol == symbol) {
        foundHolding := ?holding;
      } else {
        otherHoldings := Array.append(otherHoldings, [holding]);
      };
    };
    
    switch (foundHolding) {
      case (?holding) {
        if (holding.amount < assetAmount) return null;
        
        // Calculate Delta value
        let inrValue = assetAmount * currentPrice;
        let deltaValue = inrValue * DELTA_CONVERSION_RATE;
        
        // Update or remove holding
        let newHoldings = if (holding.amount == assetAmount) {
          // Selling all
          otherHoldings;
        } else {
          // Partial sale
          let remainingAmount = holding.amount - assetAmount;
          let proportionSold = assetAmount / holding.amount;
          let investedSold = holding.totalInvested * proportionSold;
          
          let updatedHolding : AssetHolding = {
            assetType = holding.assetType;
            symbol = holding.symbol;
            amount = remainingAmount;
            avgPurchasePrice = holding.avgPurchasePrice;
            totalInvested = holding.totalInvested - investedSold;
            purchaseDate = holding.purchaseDate;
          };
          Array.append(otherHoldings, [updatedHolding]);
        };
        
        investmentWallet := {
          deltaBalance = investmentWallet.deltaBalance + deltaValue;
          holdings = newHoldings;
        };
        
        _recordTransaction("sell_asset", deltaValue / DELTA_CONVERSION_RATE, currentValue, symbol, "Investment", ["Asset", "Sell"]);
        return ?investmentWallet.deltaBalance;
      };
      case (null) return null;
    };
  };

  public query func getInvestmentWallet() : async InvestmentWallet {
    return investmentWallet;
  };

  public query func getPortfolioValue(prices : [(Text, Float)]) : async Float {
    var totalValue = investmentWallet.deltaBalance;
    
    for (holding in investmentWallet.holdings.vals()) {
      // Find current price for this asset
      var currentPrice : Float = 0.0;
      for ((symbol, price) in prices.vals()) {
        if (symbol == holding.symbol) {
          currentPrice := price;
        };
      };
      
      if (currentPrice > 0.0) {
        let inrValue = holding.amount * currentPrice;
        let deltaValue = inrValue * DELTA_CONVERSION_RATE;
        totalValue += deltaValue;
      };
    };
    
    return totalValue;
  };
};
