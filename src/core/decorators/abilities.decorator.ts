import { SetMetadata } from "@nestjs/common";
import { Subjects } from "src/casl/casl-ability.factory/casl-ability.factory";
import { Action } from "src/core/types/global.types";

export interface AbilityRequiredRules {
    action: Action,
    subject: Subjects,
}

export const CHECK_ABILITY = 'check_ability'

export const ChekcAbilities = (...requirements: AbilityRequiredRules[]) => SetMetadata(CHECK_ABILITY, requirements); 