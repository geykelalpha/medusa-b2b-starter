import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import { Resend } from "resend";
import { templates } from "./templates";

type InjectedDependencies = {
  logger: Logger;
};

type ResendOptions = {
  api_key: string;
  from: string;
  /**
   * When set, every email is delivered to this address instead of the real
   * recipient. Meant for development only.
   */
  test_recipient?: string;
};

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend";

  protected resend_: Resend;
  protected options_: ResendOptions;
  protected logger_: Logger;

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the Resend provider's options."
      );
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the Resend provider's options."
      );
    }
  }

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super();
    this.resend_ = new Resend(options.api_key);
    this.options_ = options;
    this.logger_ = logger;
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const template = templates[notification.template];

    if (!template) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Resend template "${notification.template}" does not exist`
      );
    }

    const data = (notification.data ?? {}) as Record<string, unknown>;
    const subject = notification.content?.subject || template.subject(data);
    const testRecipient = this.options_.test_recipient;

    if (testRecipient) {
      this.logger_.info(
        `Redirecting "${notification.template}" email for ${notification.to} to test recipient ${testRecipient}`
      );
    }

    const { data: result, error } = await this.resend_.emails.send({
      from: notification.from?.trim() || this.options_.from,
      to: [testRecipient || notification.to],
      subject: testRecipient ? `[to: ${notification.to}] ${subject}` : subject,
      html: notification.content?.html || template.html(data),
    });

    if (error || !result) {
      this.logger_.error(
        `Failed to send "${notification.template}" email: ${error?.message}`
      );
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email: ${error?.message ?? "unknown error"}`
      );
    }

    return { id: result.id };
  }
}

export default ResendNotificationProviderService;
