<?php

namespace Oro\Bundle\WorkflowBundle\Model;

use Oro\Bundle\WorkflowBundle\Exception\MissedRequiredOptionException;

abstract class AbstractAssembler
{
    /**
     * Get entity type
     *
     * @param array $configuration
     * @return string
     */
    protected function getEntityType(array $configuration)
    {
        $keys = array_keys($configuration);
        return $keys[0];
    }

    /**
     * Get entity parameters
     *
     * @param array $configuration
     * @return mixed
     */
    protected function getEntityParameters(array $configuration)
    {
        $values = array_values($configuration);
        return $values[0];
    }

    /**
     * Check that configuration is an entity configuration
     *
     * @param mixed $configuration
     * @return bool
     */
    protected function isService($configuration)
    {
        if (!is_array($configuration) || count($configuration) != 1) {
            return false;
        }
        return strpos($this->getEntityType($configuration), '@') === 0;
    }

    /**
     * Get name of service referenced to $entityType
     *
     * @param string $entityType
     * @return bool
     */
    protected function getServiceName($entityType)
    {
        return substr($entityType, 1);
    }

    /**
     * @param array $options
     * @param array $requiredOptions
     * @throws MissedRequiredOptionException
     */
    protected function assertOptions(array $options, array $requiredOptions)
    {
        foreach ($requiredOptions as $optionName) {
            if (empty($options[$optionName])) {
                throw new MissedRequiredOptionException(sprintf('Option "%s" is required', $optionName));
            }
        }
    }

    /**
     * @param array $options
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    protected function getOption(array $options, $key, $default)
    {
        if (isset($options[$key])) {
            return $options[$key];
        }
        return $default;
    }
}
