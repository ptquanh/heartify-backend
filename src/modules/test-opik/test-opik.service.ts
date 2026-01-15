import { Opik } from 'opik';

import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKEN } from '@shared/constants';

import { TestOpikInputDto } from './test-opik.dto';

@Injectable()
export class TestOpikService {
  constructor(
    @Inject(INJECTION_TOKEN.OPIK_SERVICE)
    private readonly opikClient: Opik,
  ) {}

  async testTrace(dto: TestOpikInputDto) {
    const trace = this.opikClient.trace({
      name: 'test_opik_trace',
      input: { message: dto.message },
      output: { status: 'success' },
      tags: ['test', 'simple'],
    });

    return {
      success: true,
      traceId: (trace as any)?.id,
      message: 'Trace sent to Opik',
    };
  }

  async testErrorTrace(dto: TestOpikInputDto) {
    try {
      throw new Error('Simulated Error for Opik Testing');
    } catch (error) {
      const trace = this.opikClient.trace({
        name: 'test_opik_error',
        input: { message: dto.message },
        output: { error: error.message },
        tags: ['test', 'error'],
        // Assuming Opik supports status or error fields in metadata
        metadata: {
          error_stack: error.stack,
          success: false,
        },
      });
      return {
        success: false,
        traceId: (trace as any)?.id,
        message: 'Error Trace sent to Opik',
      };
    }
  }

  async testSpan(dto: TestOpikInputDto) {
    // Simulating a nested span structure manually if SDK doesn't support context propagation automatically in this version
    // or just logging 'parent' and 'child' traces.

    const parentTrace = this.opikClient.trace({
      name: 'test_parent_span',
      input: { task: 'Parent Task', ...dto },
      tags: ['test', 'parent'],
    });

    const parentId = (parentTrace as any)?.id;

    // Simulate child work
    const childTrace = this.opikClient.trace({
      name: 'test_child_span',
      input: { task: 'Child Task', parentId },
      output: { result: 'Child Done' },
      tags: ['test', 'child'],
      // In real Opik SDK, we would link this to parentId if supported via 'parent_trace_id' or similar
      metadata: {
        parent_trace_id: parentId,
      },
    });

    return {
      success: true,
      parentTraceId: parentId,
      childTraceId: (childTrace as any)?.id,
      message: 'Parent and Child traces sent',
    };
  }

  async testLLMCall(dto: TestOpikInputDto) {
    const trace = this.opikClient.trace({
      name: 'test_llm_generation',
      input: {
        messages: [{ role: 'user', content: dto.message }],
        model: 'gpt-4-simulated',
      },
      output: {
        role: 'assistant',
        content: `Simulated response to: ${dto.message}`,
      },
      tags: ['test', 'llm'],
    });

    return {
      success: true,
      traceId: (trace as any)?.id,
      message: 'LLM Simulation Trace sent to Opik',
    };
  }

  async testFeedback(dto: TestOpikInputDto) {
    // Create a trace
    const trace = this.opikClient.trace({
      name: 'test_feedback_target',
      input: { message: dto.message },
      output: { response: 'Waiting for feedback' },
      tags: ['test', 'feedback_target'],
    });

    // Simulate logging feedback
    // In strict Opik SDK this might be trace.score() or client.logFeedback()
    // For now we just return the ID and say we would log feedback:
    const score = dto.feedbackScore ?? 1;

    // Hypothetical call:
    // (trace as any)?.reportFeedback({ score });

    return {
      success: true,
      traceId: (trace as any)?.id,
      simulatedFeedbackScore: score,
      message: 'Trace created for feedback testing',
    };
  }

  async testContextPropagation(dto: TestOpikInputDto, traceId?: string) {
    // Simulate receiving a request with a trace ID
    const trace = this.opikClient.trace({
      name: 'test_context_propagation',
      input: { message: dto.message, receivedTraceId: traceId },
      tags: ['test', 'distributed'],
      // linking to parent if Opik supports it via arguments or metadata
      metadata: {
        parent_trace_id: traceId || 'none',
      },
    });

    return {
      success: true,
      newTraceId: (trace as any)?.id,
      linkedToParent: !!traceId,
      message: 'Context propagation test',
    };
  }

  async testImageLogging(dto: TestOpikInputDto) {
    // Simulating logging an image input (e.g. base64 or URL)
    const trace = this.opikClient.trace({
      name: 'test_image_input',
      input: {
        role: 'user',
        content: [
          { type: 'text', text: dto.message },
          {
            type: 'image_url',
            image_url: {
              url: 'https://example.com/sample-heart-ecg.png',
            },
          },
        ],
      },
      output: { analysis: 'Normal Sinus Rhythm' },
      tags: ['test', 'multimodal', 'image'],
      metadata: {
        image_resolution: '1024x1024',
        model_version: 'gpt-4-vision-preview',
      },
    });

    return {
      success: true,
      traceId: (trace as any)?.id,
      message: 'Multimodal Image Trace sent to Opik',
    };
  }

  async testAgentWorkflow(dto: TestOpikInputDto) {
    // 1. Root Trace: "Agent Execution"
    const rootTrace = this.opikClient.trace({
      name: 'agent_execution_workflow',
      input: { user_query: dto.message },
      tags: ['test', 'agent', 'workflow'],
    });
    const rootId = (rootTrace as any)?.id;

    // 2. Step 1: "Thought Process" (Span)
    const thoughtSpan = this.opikClient.trace({
      name: 'agent_thought',
      input: { context: 'Analyzing user request...' },
      output: { thought: 'User wants health advice. Need to check vitals.' },
      tags: ['thought'],
      metadata: { parent_trace_id: rootId },
    });

    // 3. Step 2: "Tool Call: Check Vitals" (Span)
    const toolSpan = this.opikClient.trace({
      name: 'tool_check_vitals',
      input: { tool_name: 'vitals_db', query: 'SELECT * FROM health_records' },
      output: { vitals: { bp: '120/80', hr: 72 } },
      tags: ['tool'],
      metadata: { parent_trace_id: rootId },
    });

    // 4. Step 3: "LLM Generation: Final Answer" (Span/LLM)
    const llmSpan = this.opikClient.trace({
      name: 'llm_final_answer',
      input: {
        messages: [
          { role: 'system', content: 'You are a medical assistant.' },
          { role: 'user', content: dto.message },
          {
            role: 'function',
            name: 'check_vitals',
            content: JSON.stringify({ bp: '120/80' }),
          },
        ],
        model: 'gpt-4',
      },
      output: {
        role: 'assistant',
        content: 'Your vitals look great! Keep up the good work.',
      },
      tags: ['llm'],
      metadata: { parent_trace_id: rootId },
    });

    // In a real scenario, we might update the rootTrace with the final output here if the SDK supported stateful handles.
    // For this test, we just assume they are linked by ID in the backend.

    return {
      success: true,
      rootTraceId: rootId,
      childSpans: [
        (thoughtSpan as any)?.id,
        (toolSpan as any)?.id,
        (llmSpan as any)?.id,
      ],
      message: 'Complex Agent Workflow simulated',
    };
  }

  async testPromptTracking(dto: TestOpikInputDto) {
    // Simulate using a managed prompt
    const promptName = 'customer_service_reply';
    const promptVersion = 'v1.0.2';
    const template = 'You are a helpful assistant. User says: {{message}}';

    const filledPrompt = template.replace('{{message}}', dto.message);

    const trace = this.opikClient.trace({
      name: 'test_prompt_usage',
      input: {
        message: dto.message,
        prompt_variables: { message: dto.message },
      },
      output: { response: 'This is a response based on the template.' },
      tags: ['test', 'prompt_management'],
      metadata: {
        // Standard Opik/Comet conventions for linking prompts often involve specific metadata keys
        // or just purely tracking it here for visibility.
        prompt_name: promptName,
        prompt_version: promptVersion,
        prompt_template: template,
      },
    });

    return {
      success: true,
      traceId: (trace as any)?.id,
      message: 'Trace with Prompt info sent',
    };
  }

  async testBatchTraces(dto: TestOpikInputDto) {
    const traceIds = [];
    for (let i = 0; i < 3; i++) {
      const trace = this.opikClient.trace({
        name: `test_batch_${i}`,
        input: { batch_index: i, original_msg: dto.message },
        output: { processed: true },
        tags: ['test', 'batch'],
      });
      traceIds.push((trace as any)?.id);
    }
    return {
      success: true,
      traceIds,
      message: 'Batch traces sent',
    };
  }

  async testTokenTracking(dto: TestOpikInputDto) {
    const trace = this.opikClient.trace({
      name: 'test_token_usage',
      input: { message: dto.message },
      output: { response: 'Short response.' },
      tags: ['test', 'usage'],
      metadata: {
        usage: {
          prompt_tokens: 15,
          completion_tokens: 5,
          total_tokens: 20,
        },
        model: 'gpt-3.5-turbo',
      },
    });

    return {
      success: true,
      traceId: (trace as any)?.id,
      message: 'Trace with Token Usage sent',
    };
  }

  async testStreamingSimulation(dto: TestOpikInputDto) {
    // Simulate accumulation
    let streamedResponse = '';
    const chunks = ['Hello', ' ', 'World', ' ', 'from', ' ', 'Stream!'];

    // Mock duration
    const startTime = new Date();
    // Added a small delay simulation in real life, but here just setting time

    for (const chunk of chunks) {
      streamedResponse += chunk;
    }

    const endTime = new Date();

    const trace = this.opikClient.trace({
      name: 'test_streaming_response',
      input: { prompt: dto.message },
      output: { content: streamedResponse },
      tags: ['test', 'streaming'],
      metadata: {
        streamed: true,
        chunk_count: chunks.length,
      },
      startTime,
      endTime,
    });

    return {
      success: true,
      traceId: (trace as any)?.id,
      message: 'Streaming simulated trace sent',
    };
  }

  async testRAGRetrieval(dto: TestOpikInputDto) {
    const rootTrace = this.opikClient.trace({
      name: 'rag_pipeline',
      input: { query: dto.message },
      tags: ['test', 'rag'],
    });
    const rootId = (rootTrace as any)?.id;

    // 1. Retrieval Span
    const retrievalSpan = this.opikClient.trace({
      name: 'retrieval_step',
      input: { query: dto.message, top_k: 3 },
      output: {
        documents: [
          { id: 'doc1', content: 'Heart health is important.', score: 0.92 },
          { id: 'doc2', content: 'Exercise prevents disease.', score: 0.88 },
          { id: 'doc3', content: 'Diet matters.', score: 0.75 },
        ],
      },
      tags: ['retrieval', 'vector_db'],
      metadata: { parent_trace_id: rootId },
    });

    // 2. Generation Span
    const generationSpan = this.opikClient.trace({
      name: 'rag_generation',
      input: {
        context: 'Heart health is important. Exercise prevents disease.',
        query: dto.message,
      },
      output: {
        response: 'Based on the documents, exercise and diet are key.',
      },
      tags: ['llm', 'generation'],
      metadata: { parent_trace_id: rootId },
    });

    return {
      success: true,
      rootTraceId: rootId,
      retrievalSpanId: (retrievalSpan as any)?.id,
      generationSpanId: (generationSpan as any)?.id,
      message: 'RAG Pipeline simulated',
    };
  }

  async testGuardrails(dto: TestOpikInputDto) {
    const trace = this.opikClient.trace({
      name: 'guardrail_check',
      input: { user_input: dto.message },
      output: {
        passed: true,
        sanitized_input: dto.message,
        violation: null,
      },
      tags: ['test', 'guardrails', 'safety'],
      metadata: {
        filters: ['pii', 'toxicity', 'jailbreak'],
        confidence_score: 0.99,
      },
    });

    return {
      success: true,
      traceId: (trace as any)?.id,
      message: 'Guardrails check simulated',
    };
  }

  async testMultiTurnConversation(dto: TestOpikInputDto) {
    const threadId = `thread_${Date.now()}`;
    const turns = [
      { role: 'user', content: 'Hi, I need help.' },
      { role: 'assistant', content: 'Sure, what do you need?' },
      { role: 'user', content: dto.message },
      { role: 'assistant', content: 'I can help with that.' },
    ];

    const threadTrace = this.opikClient.trace({
      name: 'conversation_thread',
      input: { thread_id: threadId, initial_message: turns[0].content },
      output: { final_message: turns[3].content },
      tags: ['test', 'conversation', 'thread'],
      metadata: { thread_id: threadId, turn_count: turns.length },
    });

    // Simulate each turn as a span or sub-trace
    const spans = turns.map((turn, i) => ({
      id: (
        this.opikClient.trace({
          name: `turn_${i + 1}`,
          input: { role: turn.role, content: turn.content },
          tags: ['turn'],
          metadata: {
            parent_trace_id: (threadTrace as any)?.id,
            thread_id: threadId,
          },
        }) as any
      )?.id,
    }));

    return {
      success: true,
      threadId,
      rootTraceId: (threadTrace as any)?.id,
      turnSpanIds: spans.map((s) => s.id),
      message: 'Multi-turn conversation simulated',
    };
  }

  async testOnlineEvaluation(dto: TestOpikInputDto) {
    // Simulate a trace that triggers an online evaluation (e.g. Hallucination check)
    const trace = this.opikClient.trace({
      name: 'eval_candidate',
      input: { question: 'What is the capital of Mars?' },
      output: { answer: 'Mars has no capital.' },
      tags: ['test', 'eval_online'],
    });

    // Simulate the result of an online eval running
    // In reality, this might happen async or via a separate Eval Client
    const evalResult = {
      metric: 'hallucination',
      score: 0.0,
      reasoning: 'Factually correct.',
    };

    return {
      success: true,
      traceId: (trace as any)?.id,
      simulatedEval: evalResult,
      message: 'Trace for Online Evaluation created',
    };
  }

  async testFullScenario(dto: TestOpikInputDto) {
    // Root: Agent Interaction
    const root = this.opikClient.trace({
      name: 'e2e_medical_agent',
      input: { query: dto.message },
      tags: ['e2e', 'production_sim'],
      metadata: { user_id: 'user_123', session_id: 'sess_abc' },
    });
    const rootId = (root as any)?.id;

    // 1. Retrieve History
    const historySpan = this.opikClient.trace({
      name: 'retrieve_history',
      input: { user_id: 'user_123' },
      output: { history_summary: 'Patient has history of hypertension.' },
      tags: ['db', 'retrieval'],
      metadata: { parent_trace_id: rootId },
    });

    // 2. RAG Retrieval via Vector DB
    const ragSpan = this.opikClient.trace({
      name: 'vector_search',
      input: { query: dto.message, top_k: 2 },
      output: {
        chunks: [
          'Hypertension management guidelines 2024...',
          'Dietary restrictions for high BP...',
        ],
      },
      tags: ['vector_db', 'rag'],
      metadata: { parent_trace_id: rootId },
    });

    // 3. LLM Generation
    const llmSpan = this.opikClient.trace({
      name: 'llm_generation',
      input: {
        system: 'You are a helpful medical assistant.',
        user: dto.message,
        context: 'Patient has hypertension. Guidelines: ...',
      },
      output: {
        content: 'Please reduce salt intake and monitor BP daily.',
      },
      tags: ['llm', 'gpt-4'],
      metadata: {
        parent_trace_id: rootId,
        usage: { total_tokens: 150 },
        model: 'gpt-4-turbo',
      },
    });

    // 4. Guardrail / Safety Check on Output
    const safetySpan = this.opikClient.trace({
      name: 'safety_guardrail',
      input: { response: 'Please reduce salt intake...' },
      output: { safe: true, topics: ['medical_advice'] },
      tags: ['guardrail', 'compliance'],
      metadata: { parent_trace_id: rootId },
    });

    return {
      success: true,
      traceId: rootId,
      message: 'Full E2E Scenario Trace Sent',
      steps: {
        history: (historySpan as any)?.id,
        rag: (ragSpan as any)?.id,
        llm: (llmSpan as any)?.id,
        safety: (safetySpan as any)?.id,
      },
    };
  }
}
