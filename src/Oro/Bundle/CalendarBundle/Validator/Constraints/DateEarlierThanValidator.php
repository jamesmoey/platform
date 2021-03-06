<?php

namespace Oro\Bundle\CalendarBundle\Validator\Constraints;

use Symfony\Component\Form\FormInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class DateEarlierThanValidator extends ConstraintValidator
{

    /**
     * @param \DateTime $value
     * @param Constraint|DateEarlierThan $constraint
     * @throws UnexpectedTypeException
     */
    public function validate($value, Constraint $constraint)
    {
        if (!$value instanceof \DateTime) {
            throw new UnexpectedTypeException($value, 'DateTime');
        }

        $root = $this->context->getRoot();

        if (!$root instanceof FormInterface) {
            throw new UnexpectedTypeException($root, 'FormInterface');
        }

        $valueCompare = $root->get($constraint->field)->getData();

        if (!$valueCompare instanceof \DateTime) {
            throw new UnexpectedTypeException($value, 'DateTime');
        }

        if ($value->getTimestamp() > $valueCompare->getTimestamp()) {
            $this->context->addViolation($constraint->message, array('{{ field }}' => $constraint->field));
        }
    }
}
