import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { acquireProjectMigrationLock, releaseProjectMigrationLock, enterLegacyCompatibilityOperation, MIGRATION_CHECKPOINTS, LEGACY_COMPATIBILITY_OPERATION_IDS } from "../src/migration";
import { runCli } from "../src/cli";
import { callMakeDocsMcpTool, deriveMcpToolName } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import { invokeOperation, getOperation } from "../src/operations/registry";
import { loadInstalledSystemResourceProvider } from "../src/operations/resource/provider";
import { UAT_WORKFLOW_RESOURCES, validateUatCheckpoint10 } from "../src/operations/uat/ops";
import { scenarioSchema, decisionSchema } from "../src/operations/uat/schemas";
import { TEMPLATE_ROOT } from "../src/utils";
const roots: string[] = [];
afterEach(() => { vi.restoreAllMocks(); roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })); });
function write(root: string, name: string, body: string) {
  mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); writeFileSync(path.join(root, name), body);
  return { path: name, sha256: createHash("sha256").update(body).digest("hex") };
}
const fence = String.fromCharCode(96).repeat(3);
const jsonBody = (value: unknown) => fence+"json\n"+JSON.stringify(value, null, 2)+"\n"+fence+"\n";
function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "p7-ugt-")); roots.push(root);
  const proof = write(root, "docs/assets/user/testing/isolation.md", "Operator inspected a new isolated context with no repository or private memory. Public installer only.\n");
  const decision = { testing_type: "Unassisted Goal Testing" as const, decision_informed: "Can a user find saved work?", reason_now: "Public discovery remains uncertain",
    product_maturity: "candidate", scope: "macOS terminal", executor: "Tester", gate_effect: "advisory" as const,
    effort_budget: "one attempt, ten minutes", stop_condition: "goal or timebox", evidence_retained: [proof.path], rerun_trigger: "public flow changes" };
  const qualification = { executor: "Tester", kind: "agent" as const, separate_context: "isolated-session-2",
    no_private_knowledge: true as const, no_repository_access: true as const, no_private_memory: true as const,
    no_implementation_conversation: true as const, no_coaching: true as const, public_information_only: true as const,
    assessed_by: "Operator", assessment: "Access settings and clean context inspected", isolation_evidence: [proof] };
  const scenario = { selected_persona: "user", scenario_id: "NUAT-101", scenario_version: 1, title: "Find saved work", user_goal: "Find your saved work",
    source_requirements: ["docs/prd/01-product.md#R-SAVE"], target_user: "new user", current_uncertainty: "Will they find their work?",
    supported_scope: "macOS terminal", build_identity: "package@1.0.0 sha256:abc", environment: "public package on macOS",
    starting_state: "One saved item", public_resources: ["https://example.com/help"], prohibited_context: ["repository and private conversation"],
    tester_prompt: "You saved work yesterday. Find your saved work.", operator_success_outcomes: ["The saved item is open"],
    setup: "Check consent, clean context, capture and readiness", teardown: "Remove disposable account and redact capture",
    evidence_requirements: ["material observations"], severity_rules: "contract severity scale", finding_route: "docs/prd/01-product.md#R-SAVE",
    decision, tester_packet: { situation: "You saved work yesterday", goal: "Find your saved work", starting_state: "One saved item",
      public_resources: ["https://example.com/help"], safety_limits: "Use disposable data", consent_notice: "Capture is optional",
      tester_teardown: "Close the disposable account" }, packet_review: { reviewer: "Operator", evidence: proof, no_hidden_guidance: true as const } };
  const source = write(root, "docs/prd/01-product.md", "# Active Product\n\n"+jsonBody(scenario));
  const target = { build_identity: scenario.build_identity, environment: scenario.environment, supported_scope: scenario.supported_scope,
    target_user: scenario.target_user, normally_consumable_form: "published package", audience_consumption_evidence: proof,
    qualification, consent: "consent recorded", capture: "redacted notes", readiness: "ready" };
  const finding = { finding_id: "F-101", run_id: "run-101", scenario_id: scenario.scenario_id, scenario_version: 1,
    observed_behavior: "Help was hard to find", expected_human_outcome: "Find help", severity: "moderate" as const, reproducibility: "same starting state",
    supported_scope: scenario.supported_scope, source_requirement: "docs/prd/01-product.md#R-SAVE", owner: "Maintainer",
    disposition: "open", disposition_authority: write(root, "docs/assets/user/testing/disposition.md", jsonBody({ finding_id: "F-101", owner: "Maintainer", disposition: "open" })), evidence: [proof] };
  const findingRecord = write(root, "docs/assets/user/testing/finding.md", jsonBody(finding));
  const run = { run_id: "run-101", scenario_ref: { ...source, scenario_id: scenario.scenario_id, scenario_version: 1 },
    selected_persona: "user", persona_primitive: "user" as const, persona_resolution: "default" as const, work_coordinate: "W1 R1 P1",
    product_build: scenario.build_identity, environment: scenario.environment, support_scope: scenario.supported_scope, target_user: scenario.target_user,
    qualification, public_resources_used: scenario.public_resources, interventions: [], observations: ["Goal found"], reproduction: "repeat initial state",
    evidence_refs: [proof], findings: [], cleanup_state: "disposable state removed", review: "Operator reviewed observations",
    validity: { private_knowledge: false, broken_setup: false, lost_evidence: false, assessed_by: "Operator" } };
  const resultValue = { decision, result: "clear" as const, run };
  const resultRecord = write(root, "docs/assets/user/testing/result.md", jsonBody(resultValue));
  return { root, proof, decision, qualification, scenario, source, target, finding, findingRecord, run, resultValue, resultRecord };
}
function invoke(id: string, input: unknown) { return invokeOperation(id, input, createExecutionContext({ surface: "test", writesAllowed: false })); }
function args(id: string, input: unknown) { return ["run", ...id.split("."), "--payload-json", JSON.stringify(input), "--json"]; }
describe("P7 fixed focused budget", () => {
  it("D1 validates governing resources and schemas before activation; dogfood bodies match", () => {
    const f = fixture(); expect(scenarioSchema.safeParse(f.scenario).success).toBe(true); expect(decisionSchema.safeParse(f.decision).success).toBe(true);
    const provider = loadInstalledSystemResourceProvider(); expect(provider.ok).toBe(true); if (!provider.ok) throw new Error(provider.error.message);
    for (const uri of UAT_WORKFLOW_RESOURCES) {
      const entry = provider.value.resources.find((item) => item.identity.uri === uri)!; expect(entry, uri).toBeDefined();
      const relative = path.relative(TEMPLATE_ROOT, entry.sourcePath);
      expect(readFileSync(path.resolve(TEMPLATE_ROOT, "../../..", relative), "utf8")).toBe(readFileSync(entry.sourcePath, "utf8"));
    }
    expect(scenarioSchema.safeParse({ ...f.scenario, scenario_version: 0 }).success).toBe(false);
  });
  const ids = ["uat.persona.resolve", "uat.scenario.validate", "uat.target.validate", "uat.evidence-reference.validate", "uat.finding.validate", "uat.result.validate"];
  for (const [index,id] of ids.entries()) it("O"+(index+1)+" "+id+" shares CLI and MCP results", async () => {
    const f = fixture(); const payloads = [{}, { source: f.source, scenario: f.scenario }, { target: f.target }, { evidence: f.proof },
      { record: f.findingRecord, finding: f.finding }, { record: f.resultRecord, ...f.resultValue }];
    const input = { targetRoot: f.root, ...payloads[index] }; let stdout = "";
    vi.spyOn(process.stdout, "write").mockImplementation((value) => { stdout += value; return true; });
    await runCli(args(id,input)); const mcp = await callMakeDocsMcpTool(deriveMcpToolName(id),input); const cli = JSON.parse(stdout);
    expect(getOperation(id).status).toBe("active"); const direct = await invoke(id,input);
    expect(JSON.stringify(cli)).toContain(JSON.stringify(direct.value)); expect(JSON.stringify(mcp)).toContain(JSON.stringify(direct.value));
  });
  it("O7 invalid input fails through both transports", async () => {
    await expect(runCli(args("uat.target.validate",{}))).rejects.toThrow();
    await expect(callMakeDocsMcpTool("make_docs_uat_target_validate",{})).rejects.toThrow();
  });
  it("O8 provider workflow works without snapshots or Skill", async () => {
    const f = fixture(); expect((await invoke("uat.persona.resolve",{targetRoot:f.root})).value).toMatchObject({authority:UAT_WORKFLOW_RESOURCES,persona:{slug:"user"}});
  });
  it("P1 no-input Persona uses canonical user", async () => {
    const f=fixture(); expect((await invoke("uat.persona.resolve",{targetRoot:f.root})).value).toMatchObject({persona:{slug:"user",primitive:"user",resolution:"default"}});
  });
  it("P2 configured maintainer uses its actual slug", async () => {
    const f=fixture(); write(f.root,".make-docs/config.yaml","personas:\n  - slug: operator\n    label: Operator\n    description: Product operators\n    primitive: maintainer\n");
    expect((await invoke("uat.persona.resolve",{targetRoot:f.root,persona:"operator"})).value).toMatchObject({persona:{slug:"operator",primitive:"maintainer",evidence_root:"docs/assets/operator/testing/"}});
  });
  it("P3 unknown, agent and frontmatter drift fail closed", async () => {
    const f=fixture(); for(const persona of ["unknown","agent"]) await expect(invoke("uat.persona.resolve",{targetRoot:f.root,persona})).rejects.toMatchObject({code:"invalid-persona"});
    const artifact=write(f.root,f.proof.path,"---\npersona: developer\n---\nReview");
    await expect(invoke("uat.persona.resolve",{targetRoot:f.root,artifact})).rejects.toMatchObject({code:"invalid-persona"});
  });
  it("P4 self-attestation and missing isolation evidence fail", async () => {
    const f=fixture(); f.target.qualification.assessed_by="Tester";
    await expect(invoke("uat.target.validate",{targetRoot:f.root,target:f.target})).rejects.toMatchObject({code:"unqualified-executor"});
    f.target.qualification.assessed_by="Operator"; f.target.qualification.isolation_evidence[0]!.sha256="a".repeat(64);
    await expect(invoke("uat.target.validate",{targetRoot:f.root,target:f.target})).rejects.toThrow();
  });
  it("E1 scenario drift and operator leakage fail", async () => {
    const f=fixture();
    const title=(key:string)=>key.split("_").map((part)=>part[0]!.toUpperCase()+part.slice(1)).join(" ");
    const cell=(value:unknown)=>Array.isArray(value)?value.join("; "):String(value);
    const decisionTable=Object.entries(f.decision).map(([key,value])=>"| "+title(key)+" | "+cell(value)+" |").join("\n");
    const scenarioTable=Object.entries(f.scenario).filter(([key])=>!["decision","tester_packet","packet_review","build_identity","environment"].includes(key)).map(([key,value])=>"| "+title(key)+" | "+cell(value)+" |").join("\n");
    const packet=f.scenario.tester_packet;
    const markdown="## Testing Decision\n"+decisionTable+"\n### NUAT-101 Find saved work\n"+scenarioTable+"\n| Product Build And Environment | "+f.scenario.build_identity+"; "+f.scenario.environment+" |\n"+
      "- Situation: "+packet.situation+"\n- Goal: "+packet.goal+"\n- Visible starting state: "+packet.starting_state+"\n- Allowed public resources: "+packet.public_resources.join("; ")+"\n- Genuine constraints and safety notes: "+packet.safety_limits+"\n- Consent and capture notice: "+packet.consent_notice+"\n- Tester-owned teardown steps: "+packet.tester_teardown+"\n";
    const markdownSource=write(f.root,"docs/prd/02-markdown.md",markdown);
    expect((await invoke("uat.scenario.validate",{targetRoot:f.root,source:markdownSource,scenario:f.scenario})).value).toMatchObject({scenario_id:"NUAT-101"}); await expect(invoke("uat.scenario.validate",{targetRoot:f.root,source:f.source,scenario:{...f.scenario,build_identity:"other"}})).rejects.toMatchObject({code:"invalid-scenario"});
    for (const changed of [{ build_identity: "package@1" }, { environment: "public" }, { build_identity: "package@1", environment: "public" }]) {
      await expect(invoke("uat.scenario.validate",{targetRoot:f.root,source:markdownSource,scenario:{...f.scenario,...changed}})).rejects.toMatchObject({code:"invalid-scenario"});
    }
    f.scenario.tester_packet.goal=f.scenario.operator_success_outcomes[0]!;
    await expect(invoke("uat.scenario.validate",{targetRoot:f.root,source:write(f.root,f.source.path,jsonBody(f.scenario)),scenario:f.scenario})).rejects.toMatchObject({code:"invalid-scenario"});
  });
  it("E2 evidence paths reject archives, traversal, other Persona and symlink escape", async () => {
    const f=fixture();
    for(const name of [".make-docs/archive/x","docs/artifacts/x","docs/assets/testing/x","docs/assets/developer/testing/x","docs/assets/user/testing/../../x"]) await expect(invoke("uat.evidence-reference.validate",{targetRoot:f.root,evidence:{...f.proof,path:name}})).rejects.toMatchObject({code:"prohibited-evidence-path"});
    symlinkSync(os.tmpdir(),path.join(f.root,"docs/assets/user/testing/escape"));
    await expect(invoke("uat.evidence-reference.validate",{targetRoot:f.root,evidence:{...f.proof,path:"docs/assets/user/testing/escape/x"}})).rejects.toMatchObject({code:"prohibited-evidence-path"});
  });
  it("E3 finding disposition remains bound to repository record", async () => {
    const f=fixture(); await expect(invoke("uat.finding.validate",{targetRoot:f.root,record:f.findingRecord,finding:{...f.finding,disposition:"closed"}})).rejects.toMatchObject({code:"invalid-finding"});
    const unrelated={...f.finding,disposition:"unresolved",disposition_authority:f.proof};
    await expect(invoke("uat.finding.validate",{targetRoot:f.root,record:write(f.root,f.findingRecord.path,jsonBody(unrelated)),finding:unrelated})).rejects.toMatchObject({code:"invalid-finding"});
    for (const disposition of ["open","unresolved","accepted risk for this scope"]) {
      const finding={...f.finding,disposition,disposition_authority:write(f.root,"docs/assets/user/testing/disposition.md",jsonBody({finding_id:f.finding.finding_id,owner:f.finding.owner,disposition}))};
      const value={...f.resultValue,run:{...f.run,findings:[finding]}};
      expect((await invoke("uat.result.validate",{targetRoot:f.root,record:write(f.root,f.resultRecord.path,jsonBody(value)),...value})).value).toMatchObject({valid:false,validation_status:"unverified",result:"clear",recorded_human_conclusion:false,findings_require_review:true,retained_findings:[{finding_id:f.finding.finding_id,disposition}]});
    }

  });
  it("E4 results stay distinct; blocking needs current authority", async () => {
    const f=fixture(); for(const result of ["clear","friction","blocked","invalid-run"] as const) {
      const value={...f.resultValue,result}; const record=write(f.root,f.resultRecord.path,jsonBody(value));
      expect((await invoke("uat.result.validate",{targetRoot:f.root,record,...value})).value).toMatchObject({result,gate_effect:"advisory"});
    }
    const none={decision:{...f.decision,executor:"none"},result:"not-needed-now"};
    expect((await invoke("uat.result.validate",{targetRoot:f.root,record:write(f.root,f.resultRecord.path,jsonBody(none)),...none})).value).toMatchObject({result:"not-needed-now",run_occurred:false});
    for (const changed of [{executor:"A different executor"},{scope:"Windows public release"}]) {
      const value={...f.resultValue,decision:{...f.decision,...changed}};
      await expect(invoke("uat.result.validate",{targetRoot:f.root,record:write(f.root,f.resultRecord.path,jsonBody(value)),...value})).rejects.toMatchObject({code:"invalid-input"});
    }
    const obligation={id:"O-123",owner:"Maintainer",trigger:"new goal",target:"next release",exit_criteria:"bounded question answered",reason:"accepted future outcome remains owed"};
    const unrelated={...none,future_obligation:{...obligation,accepted_authority:f.source}};
    await expect(invoke("uat.result.validate",{targetRoot:f.root,record:write(f.root,f.resultRecord.path,jsonBody(unrelated)),...unrelated})).rejects.toMatchObject({code:"invalid-input"});
    const accepted=write(f.root,"docs/prd/03-accepted-outcome.md",jsonBody(obligation));
    const matched={...none,future_obligation:{...obligation,accepted_authority:accepted}};
    expect((await invoke("uat.result.validate",{targetRoot:f.root,record:write(f.root,f.resultRecord.path,jsonBody(matched)),...matched})).value).toMatchObject({result:"not-needed-now",run_occurred:false});
    for (const changed of [{id:"O-124"},{owner:"Other owner"},{trigger:"anything"},{target:"anything"},{exit_criteria:"anything"},{reason:"anything"}]) {
      const value={...matched,future_obligation:{...matched.future_obligation,...changed}};
      await expect(invoke("uat.result.validate",{targetRoot:f.root,record:write(f.root,f.resultRecord.path,jsonBody(value)),...value})).rejects.toMatchObject({code:"invalid-input"});
    }
    const blocked={...f.resultValue,decision:{...f.decision,gate_effect:"blocking-current-work"}};
    await expect(invoke("uat.result.validate",{targetRoot:f.root,record:write(f.root,f.resultRecord.path,jsonBody(blocked)),...blocked})).rejects.toMatchObject({code:"unauthorized-blocking-gate"});
  });
  it("C1 UAT is read-only and legacy operation set stays frozen", () => {
    const f=fixture();
    expect(validateUatCheckpoint10(f.root)).toMatchObject({ checkpoint:10, next_checkpoint:11, next_checkpoint_state:"implemented" });
    expect(MIGRATION_CHECKPOINTS.find((item)=>item.checkpoint===10)?.state).toBe("implemented");
    expect(MIGRATION_CHECKPOINTS.find((item)=>item.checkpoint===11)?.state).toBe("implemented");
    const lock=acquireProjectMigrationLock({projectRoot:f.root});
    try { expect(()=>enterLegacyCompatibilityOperation({projectRoot:f.root,operationId:"playbook.start",mutates:true})).toThrow(); }
    finally { releaseProjectMigrationLock(lock); }
    expect(ids.every((id)=>getOperation(id).mutates==="read")).toBe(true); expect(LEGACY_COMPATIBILITY_OPERATION_IDS).toHaveLength(18);
    expect(ids.some((id)=>LEGACY_COMPATIBILITY_OPERATION_IDS.some((legacy) => legacy === id))).toBe(false);
  });
  it("C2 old evidence remains unchanged after refused adoption", async () => {
    const f=fixture(); const old=write(f.root,"docs/artifacts/old.md","User-owned walkthrough\n");
    await expect(invoke("uat.evidence-reference.validate",{targetRoot:f.root,evidence:old})).rejects.toThrow();
    expect(readFileSync(path.join(f.root,old.path),"utf8")).toBe("User-owned walkthrough\n");
  });
  it("D2 fixed Linux and Windows paths reject noncanonical destinations", async () => {
    const f=fixture(); for(const name of ["C:\\docs\\assets\\user\\testing\\x","\\\\server\\share\\x","/tmp/x","docs/assets/user/testing\\x"]) await expect(invoke("uat.evidence-reference.validate",{targetRoot:f.root,evidence:{...f.proof,path:name}})).rejects.toMatchObject({code:"prohibited-evidence-path"});
  });
});
