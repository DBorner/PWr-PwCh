terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

# Create a VPC
resource "aws_vpc" "my_vpc" {
  cidr_block       = "10.0.0.0/16"
  instance_tenancy = "default"
  tags = {
    Name = "MyVPC"
  }
}

# Create a subnet
resource "aws_subnet" "pub_subnet" {
  vpc_id     = aws_vpc.my_vpc.id
  cidr_block = "10.0.1.0/24"
  tags = {
    Name = "My public subnet"
  }
}

# Create an internet gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.my_vpc.id
  tags = {
    Name = "My IGW"
  }
}

# Create a route table
resource "aws_route_table" "pub_rt" {
  vpc_id = aws_vpc.my_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

# Associate the route table with the subnet
resource "aws_route_table_association" "pub_rt_association" {
  subnet_id      = aws_subnet.pub_subnet.id
  route_table_id = aws_route_table.pub_rt.id
}

resource "aws_ecs_cluster" "backend_cluster" {
  name = "backend-cluster"
}

resource "aws_ecs_task_definition" "backend_task" {
  family                   = "BackendTaskDef"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = "arn:aws:iam::533267079357:role/LabRole"
  task_role_arn            = "arn:aws:iam::533267079357:role/LabRole"
  cpu                      = "1024"
  memory                   = "3072"

  container_definitions = jsonencode([
    {
      name          = "backend"
      image         = "docker.io/dbornerpwr/p_w_ch:backend"
      cpu           = 0
      essential     = true
      portMappings  = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-create-group"   = "true"
          "awslogs-group"          = "/ecs/BackendTaskDef"
          "awslogs-region"         = "us-east-1"
          "awslogs-stream-prefix"  = "ecs"
        }
      }
    }
  ])

  runtime_platform {
    cpu_architecture        = "X86_64"
    operating_system_family = "LINUX"
  }
}

resource "aws_security_group" "backend_sg" {
  name        = "backend-sg"
  description = "Allow TCP 8080 for backend"
  vpc_id      = aws_vpc.my_vpc.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_service" "backend_service" {
  name            = "backend-service"
  cluster         = aws_ecs_cluster.backend_cluster.id
  task_definition = aws_ecs_task_definition.backend_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.pub_subnet.id]
    security_groups  = [aws_security_group.backend_sg.id]
    assign_public_ip = true
  }
}
