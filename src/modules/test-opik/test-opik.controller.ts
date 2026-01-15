import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { TestOpikInputDto } from './test-opik.dto';
import { TestOpikService } from './test-opik.service';

@ApiTags('Test Opik')
@Controller('test-opik')
export class TestOpikController {
  constructor(private readonly testOpikService: TestOpikService) {}

  @Get()
  async hello() {
    return 'Hello from Test Opik Controller';
  }

  @Post('trace')
  @ApiOperation({ summary: 'Send a simple trace' })
  async testTrace(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testTrace(dto);
  }

  @Post('error')
  @ApiOperation({ summary: 'Send an error trace' })
  async testError(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testErrorTrace(dto);
  }

  @Post('span')
  @ApiOperation({ summary: 'Send parent-child traces (Span simulation)' })
  async testSpan(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testSpan(dto);
  }

  @Post('llm')
  @ApiOperation({ summary: 'Simulate an LLM generation trace' })
  async testLLM(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testLLMCall(dto);
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Create a trace intended for feedback' })
  async testFeedback(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testFeedback(dto);
  }

  @Post('context')
  @ApiOperation({ summary: 'Test distributed tracing context' })
  async testContext(
    @Body() dto: TestOpikInputDto,
    @Headers('x-trace-id') traceId: string,
  ) {
    return this.testOpikService.testContextPropagation(dto, traceId);
  }

  @Post('image')
  @ApiOperation({ summary: 'Simulate a multimodal (image) trace' })
  async testImage(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testImageLogging(dto);
  }

  @Post('agent')
  @ApiOperation({ summary: 'Simulate a complex agent workflow trace' })
  async testAgent(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testAgentWorkflow(dto);
  }

  @Post('prompt')
  @ApiOperation({ summary: 'Simulate tracking a specific prompt template' })
  async testPrompt(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testPromptTracking(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Simulate a batch of traces' })
  async testBatch(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testBatchTraces(dto);
  }

  @Post('usage')
  @ApiOperation({ summary: 'Simulate trace with token usage' })
  async testUsage(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testTokenTracking(dto);
  }

  @Post('stream')
  @ApiOperation({ summary: 'Simulate a streaming response trace' })
  async testStream(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testStreamingSimulation(dto);
  }

  @Post('rag')
  @ApiOperation({ summary: 'Simulate a RAG pipeline trace' })
  async testRAG(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testRAGRetrieval(dto);
  }

  @Post('guardrails')
  @ApiOperation({ summary: 'Simulate a Guardrails safety check trace' })
  async testGuardrails(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testGuardrails(dto);
  }

  @Post('thread')
  @ApiOperation({ summary: 'Simulate a multi-turn conversation thread' })
  async testThread(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testMultiTurnConversation(dto);
  }

  @Post('eval')
  @ApiOperation({ summary: 'Simulate a trace for online evaluation' })
  async testEval(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testOnlineEvaluation(dto);
  }

  @Post('e2e')
  @ApiOperation({ summary: 'Simulate a full End-to-End agent scenario' })
  async testE2E(@Body() dto: TestOpikInputDto) {
    return this.testOpikService.testFullScenario(dto);
  }
}
