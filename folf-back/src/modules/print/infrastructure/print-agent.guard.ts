import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PrintAgentContext,
  PrintAgentService,
} from '../application/print-agent.service';

export type PrintAgentRequest = {
  headers: Record<string, string | string[] | undefined>;
  printAgent?: PrintAgentContext;
};

@Injectable()
export class PrintAgentAuthGuard implements CanActivate {
  constructor(private readonly printAgentService: PrintAgentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PrintAgentRequest>();
    const header = request.headers.authorization ?? request.headers.Authorization;
    const raw = Array.isArray(header) ? header[0] : header;
    if (!raw?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing agent token');
    }

    const token = raw.slice('Bearer '.length).trim();
    request.printAgent = await this.printAgentService.resolveAgentFromToken(token);
    return true;
  }
}
