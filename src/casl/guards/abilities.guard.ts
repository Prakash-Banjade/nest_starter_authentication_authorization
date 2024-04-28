import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { AbilityRequiredRules, CHECK_ABILITY } from "src/decorators/abilities.decorator";
import { IS_PUBLIC_KEY } from "src/decorators/setPublicRoute.decorator";
import { CaslAbilityFactory } from "../casl-ability.factory/casl-ability.factory";
import { ForbiddenError } from "@casl/ability";
import { Roles } from "src/types/global.types";
require('dotenv').config();

@Injectable()
export class AbilitiesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private caslAbility: CaslAbilityFactory
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const rules = this.reflector.get<AbilityRequiredRules[]>(CHECK_ABILITY, context.getHandler()) || []


        if (isPublic) {
            // 💡 See this condition
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        const ability = this.caslAbility.defineAbility(user);

        try {
            rules.forEach(rule => ForbiddenError.from(ability).throwUnlessCan(rule.action, rule.subject))

            return true;
        } catch (e) {
            if (e instanceof ForbiddenError) throw new ForbiddenException(e.message)
        }
    }
}
