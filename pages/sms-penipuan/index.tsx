import React, { useState } from "react";
import {
  Box,
  Flex,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  Textarea,
  Badge,
  useFormControl,
} from "@chakra-ui/react";
import Layout from "../../components/Layout";
import {
  useQuery,
  useMutation,
  QueryClient,
  useQueryClient,
} from "react-query";
import { useForm } from "react-hook-form";
import SmsTable from "./SmsTable";

const getMessages = async () => {
  const URL = "http://localhost:3000/api/message";

  const result = await fetch(URL);
  return await result.json();
};

export type MessageProps = {
  id?: number;
  createdAt?: string;
  phoneNumber: number;
  message: string;
  status?: string; // tanda ? artinya optional
};

export function formatDate(date: string | undefined) {
  return new Date(date).toLocaleString("id-ID");
}

const submitMessage = async (data: MessageProps) => {
  const URL = "http://localhost:3000/api/message";
  const response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("An error has occured");
  }
  return await response.json();
};

export default function fakeMessage() {
  const queryClient = useQueryClient();
  const { data, isSuccess } = useQuery("get-message", getMessages, {
    staleTime: 15000,
    refetchInterval: 5000,
  });
  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
    clearErrors,
  } = useForm<MessageProps>();

  const [errMessage, setErrMessage] = useState("");

  const mutation = useMutation(submitMessage, {
    onMutate: async (newMessage) => {
      //dieksekusi ketika mutation sedang dalam proses (untuk spinner,disabled form, dll)

      //on optimistic update
      await queryClient.cancelQueries("get-message"); //cancel any outgoing refetch
      const previousMessages = queryClient.getQueryData<MessageProps[]>(
        "get-message"
      ); //snapshot the previous value

      // optimistically update new value
      if (previousMessages) {
        newMessage = { ...newMessage, createdAt: new Date().toISOString() };
        const finalMessages = [...previousMessages, newMessage];
        queryClient.setQueryData("get-message", finalMessages);
      }
      return { previousMessages };
    },
    onSettled: async (data, error: any) => {
      //ketika mutation selesai
      if (data) {
        await queryClient.invalidateQueries("get-message");
        setErrMessage(""); //clean up error
        reset();
        clearErrors(); //clear error dari react hook form
      }

      if (error) {
        setErrMessage(error.message);
      }
    },
    onSuccess: async () => {
      //ketika mutation success response
      console.log("onSuccess");
    },
    onError: async (error: any, _variables, context: any) => {
      //ketika mutation error response
      setErrMessage(error.message);
      if (context?.previousMessages) {
        queryClient.setQueryData<MessageProps[]>(
          "get-message",
          context.previousMessages
        );
      }
    },
  });

  const onSubmit = async (data: MessageProps) => {
    await mutation.mutate(data);
  };

  return (
    <Layout title="💌 SMS" subTitle="Minta Pulsa">
      <Flex>
        <Box>
          <Box
            w="md"
            p={5}
            mr={4}
            border="1px"
            borderColor="gray.200"
            boxShadow="md"
          >
            <Text
              fontSize="xl"
              fontWeight="bold"
              mb={4}
              pb={2}
              borderBottom="1px"
              borderColor="gray.200"
            >
              ✍️ Request Pulsa
            </Text>
            <form>
              <FormControl pb={4} isInvalid={errors.phoneNumber ? true : false}>
                <FormLabel
                  htmlFor="phoneNumber"
                  fontWeight="bold"
                  fontSize="xs"
                  letterSpacing="1px"
                  textTransform="uppercase"
                >
                  Phone Number
                </FormLabel>
                <Input
                  placeholder="Phone Number"
                  {...register("phoneNumber", {
                    required: "Phone number wajib diisi",
                  })}
                />
                <FormErrorMessage>
                  {errors.phoneNumber && errors.phoneNumber.message}
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.message ? true : false}>
                <FormLabel
                  htmlFor="name"
                  fontWeight="bold"
                  fontSize="xs"
                  letterSpacing="1px"
                  textTransform="uppercase"
                >
                  Message
                </FormLabel>
                <Textarea
                  placeholder="Bullshit Message"
                  {...register("message", { required: "Message wajib diisi" })}
                />
                <FormErrorMessage>
                  {errors.message && errors.message.message}
                </FormErrorMessage>
              </FormControl>

              <Button
                mt={4}
                colorScheme="teal"
                type="submit"
                onClick={handleSubmit(onSubmit)}
              >
                Send
              </Button>
            </form>
          </Box>
        </Box>
        <Box flex="1">{isSuccess && <SmsTable data={data} />}</Box>
      </Flex>
    </Layout>
  );
}
